import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok, writeAudit } from '@/lib/apiResponse';
import { requireApiAuth, requireApiAdmin } from '@/lib/apiAuth';
import { createAssetSchema } from '@/lib/schemas';

const ASSET_FIELDS = [
  'type', 'model', 'serialNumber', 'assetTag', 'locationId',
  'cpu', 'ramGb', 'storageType', 'storageGb', 'purchaseDate',
] as const;

// GET /api/assets — list with pagination + filters
export const GET = handle(async (req: NextRequest) => {
  await requireApiAuth(req);

  const sp    = req.nextUrl.searchParams;
  const page  = Math.max(1, Number(sp.get('page')  ?? 1));
  const limit = Math.min(100, Number(sp.get('limit') ?? 25));
  const skip  = (page - 1) * limit;

  const where: any = {};
  const q = sp.get('q');
  if (q) {
    where.OR = [
      { serialNumber: { contains: q, mode: 'insensitive' } },
      { assetTag:     { contains: q, mode: 'insensitive' } },
      { model:        { contains: q, mode: 'insensitive' } },
    ];
  }
  if (sp.get('type'))        where.type        = sp.get('type');
  if (sp.get('locationId'))  where.locationId  = Number(sp.get('locationId'));
  if (sp.get('needsReview') === 'true')  where.needsReview = true;
  if (sp.get('isActive') === 'true')     where.isActive    = true;
  if (sp.get('isActive') === 'false')    where.isActive    = false;

  const [items, total] = await Promise.all([
    db.asset.findMany({
      where, skip, take: limit,
      orderBy: { id: 'desc' },
      include: { location: true },
    }),
    db.asset.count({ where }),
  ]);

  return ok({ items, total, page, limit });
});

// POST /api/assets — create asset (admin only)
export const POST = handle(async (req: NextRequest) => {
  const { user } = await requireApiAdmin(req);
  const body = createAssetSchema.parse(await req.json());

  const data: any = { type: body.type };
  for (const f of ASSET_FIELDS.filter((f) => f !== 'type')) {
    if ((body as any)[f] !== undefined) data[f] = (body as any)[f];
  }
  if (data.locationId)  data.locationId  = Number(data.locationId);
  if (data.ramGb)       data.ramGb       = Number(data.ramGb);
  if (data.storageGb)   data.storageGb   = Number(data.storageGb);
  if (data.purchaseDate) data.purchaseDate = new Date(data.purchaseDate);

  const asset = await db.asset.create({ data });

  await writeAudit({
    userId: Number(user.id), action: 'asset.create',
    targetType: 'Asset', targetId: asset.id, after: asset,
    ip: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });

  return ok(asset, 201);
});
