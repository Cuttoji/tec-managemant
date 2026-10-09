import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok, err, writeAudit } from '@/lib/apiResponse';
import { requireApiAuth, requireApiAdmin, requireApiPermission } from '@/lib/apiAuth';
import { updateAssetSchema } from '@/lib/schemas';

type Ctx = { params: Promise<{ id: string }> };

const ASSET_FIELDS = [
  'type', 'model', 'serialNumber', 'assetTag', 'locationId',
  'cpu', 'ramGb', 'storageType', 'storageGb', 'purchaseDate',
] as const;

// GET /api/assets/[id]
export const GET = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireApiAuth(req);
  const { id } = await ctx.params;

  const asset = await db.asset.findUnique({
    where: { id: Number(id) },
    include: {
      location:    true,
      pageCounters: { orderBy: { recordedAt: 'desc' }, take: 5 },
    },
  });
  if (!asset) return err('Asset not found', 404);
  return ok(asset);
});

// PUT /api/assets/[id]
export const PUT = handle(async (req: NextRequest, ctx: Ctx) => {
  const { user } = await requireApiPermission('asset:edit', req);
  const { id } = await ctx.params;

  const body = updateAssetSchema.parse(await req.json());
  const before = await db.asset.findUnique({ where: { id: Number(id) } });

  const data: any = {};
  for (const f of ASSET_FIELDS) {
    if ((body as any)[f] !== undefined) data[f] = (body as any)[f];
  }
  if (data.locationId  !== undefined) data.locationId  = data.locationId  ? Number(data.locationId)  : null;
  if (data.ramGb       !== undefined) data.ramGb       = data.ramGb       ? Number(data.ramGb)       : null;
  if (data.storageGb   !== undefined) data.storageGb   = data.storageGb   ? Number(data.storageGb)   : null;
  if (data.purchaseDate !== undefined) data.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;

  const asset = await db.asset.update({
    where: { id: Number(id) },
    data,
    include: { location: true },
  });

  await writeAudit({
    userId: Number(user.id), action: 'asset.update',
    targetType: 'Asset', targetId: asset.id,
    before, after: asset,
    ip: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });

  return ok(asset);
});
