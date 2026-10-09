import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok, err, writeAudit } from '@/lib/apiResponse';
import { requireApiAuth, requireApiPermission } from '@/lib/apiAuth';
import { updateRepairDetailsSchema } from '@/lib/schemas';

type Ctx = { params: Promise<{ id: string }> };

const INCLUDE_FULL = {
  asset:      { include: { location: true } },
  dispatcher: { select: { id: true, name: true, email: true, role: true } },
  technician: { select: { id: true, name: true, email: true, role: true } },
  reviewer:   { select: { id: true, name: true, email: true, role: true } },
  loanerAsset: { select: { id: true, assetTag: true, serialNumber: true, model: true } },
  components: true,
} as const;

// GET /api/maintenance/[id]
export const GET = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireApiAuth(req);
  const { id } = await ctx.params;

  const m = await db.maintenanceLog.findUnique({
    where: { id: Number(id) },
    include: INCLUDE_FULL,
  });
  if (!m) return err('Not found', 404);
  return ok(m);
});

// PUT /api/maintenance/[id]/details — edit repair details
export const PUT = handle(async (req: NextRequest, ctx: Ctx) => {
  const { user } = await requireApiPermission('maintenance:edit', req);
  const { id } = await ctx.params;

  const existing = await db.maintenanceLog.findUnique({ where: { id: Number(id) } });
  if (!existing) return err('Not found', 404);

  if (user.role !== 'ADMIN' && Number(existing.technicianId) !== Number(user.id)) {
    return err('Only the assigned technician or ADMIN can edit repair details', 403);
  }

  const before = { repairDetails: existing.repairDetails, symptom: existing.symptom, brand: existing.brand };
  const body   = updateRepairDetailsSchema.parse(await req.json());

  if (body.usedLoaner && !body.loanerAssetId) {
    return err('loanerAssetId required when usedLoaner is true', 400);
  }
  if (body.loanerAssetId) {
    const loaner = await db.asset.findUnique({ where: { id: body.loanerAssetId } });
    if (!loaner) return err('Loaner asset not found', 404);
  }

  const data: any = {};
  const fields = [
    'symptom','partReplacedAt','brand','totalPageAtRepair',
    'repairDetails','usedLoaner','loanerAssetId','loanerPageStart','loanerPageEnd',
  ];
  for (const f of fields) {
    if ((body as any)[f] !== undefined) data[f] = (body as any)[f];
  }
  if (data.partReplacedAt) data.partReplacedAt = new Date(data.partReplacedAt);

  const updated = await db.maintenanceLog.update({
    where: { id: Number(id) }, data, include: INCLUDE_FULL,
  });

  await writeAudit({
    userId: Number(user.id), action: 'maintenance.edit_details',
    targetType: 'MaintenanceLog', targetId: Number(id),
    before, after: updated,
    ip: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });

  return ok(updated);
});
