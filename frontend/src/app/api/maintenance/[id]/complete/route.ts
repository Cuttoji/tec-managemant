import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok, err, writeAudit } from '@/lib/apiResponse';
import { requireApiAuth } from '@/lib/apiAuth';
import { completeMaintenanceSchema } from '@/lib/schemas';

type Ctx = { params: Promise<{ id: string }> };

const INCLUDE_FULL = {
  asset:      { include: { location: true } },
  dispatcher: { select: { id: true, name: true, email: true, role: true } },
  technician: { select: { id: true, name: true, email: true, role: true } },
  reviewer:   { select: { id: true, name: true, email: true, role: true } },
  loanerAsset: { select: { id: true, assetTag: true, serialNumber: true, model: true } },
  components: true,
} as const;

// POST /api/maintenance/[id]/complete
export const POST = handle(async (req: NextRequest, ctx: Ctx) => {
  const { user } = await requireApiAuth(req);
  const { id } = await ctx.params;

  if (!['ADMIN', 'TECHNICIAN'].includes(user.role)) return err('Forbidden', 403);

  const body = completeMaintenanceSchema.parse(await req.json());

  if (body.usedLoaner && !body.loanerAssetId) {
    return err('loanerAssetId required when usedLoaner is true', 400);
  }
  if (body.loanerAssetId) {
    const loaner = await db.asset.findUnique({ where: { id: body.loanerAssetId } });
    if (!loaner) return err('Loaner asset not found', 404);
  }

  const before = await db.maintenanceLog.findUnique({
    where: { id: Number(id) },
    select: { status: true, repairDetails: true },
  });

  const result = await db.maintenanceLog.updateMany({
    where: { id: Number(id), status: 'IN_PROGRESS', technicianId: Number(user.id) },
    data: {
      repairDetails:     body.repairDetails,
      symptom:           body.symptom           ?? null,
      partReplacedAt:    body.partReplacedAt     ? new Date(body.partReplacedAt) : null,
      brand:             body.brand              ?? null,
      totalPageAtRepair: body.totalPageAtRepair  ?? null,
      usedLoaner:        body.usedLoaner         ?? false,
      loanerAssetId:     body.loanerAssetId      ?? null,
      loanerPageStart:   body.loanerPageStart    ?? null,
      loanerPageEnd:     body.loanerPageEnd      ?? null,
      status:            'COMPLETED',
      completedAt:       new Date(),
    },
  });

  if (result.count === 0) {
    return err('งานนี้ยังไม่อยู่ในสถานะที่ปิดได้ หรือคุณไม่ใช่ช่างที่รับงานนี้ไว้', 409);
  }

  const updated = await db.maintenanceLog.findUnique({
    where: { id: Number(id) }, include: INCLUDE_FULL,
  });

  await writeAudit({
    userId: Number(user.id), action: 'maintenance.complete',
    targetType: 'MaintenanceLog', targetId: Number(id),
    before, after: updated,
    ip: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });

  return ok(updated);
});
