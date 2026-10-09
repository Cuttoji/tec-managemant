import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok, err, writeAudit } from '@/lib/apiResponse';
import { requireApiAuth } from '@/lib/apiAuth';

type Ctx = { params: Promise<{ id: string }> };

const INCLUDE_FULL = {
  asset:      { include: { location: true } },
  dispatcher: { select: { id: true, name: true, email: true, role: true } },
  technician: { select: { id: true, name: true, email: true, role: true } },
  reviewer:   { select: { id: true, name: true, email: true, role: true } },
  loanerAsset: { select: { id: true, assetTag: true, serialNumber: true, model: true } },
  components: true,
} as const;

// POST /api/maintenance/[id]/claim
export const POST = handle(async (req: NextRequest, ctx: Ctx) => {
  const { user } = await requireApiAuth(req);
  const { id } = await ctx.params;

  if (!['ADMIN', 'TECHNICIAN'].includes(user.role)) {
    return err('Forbidden', 403);
  }

  const result = await db.maintenanceLog.updateMany({
    where: { id: Number(id), technicianId: null, status: 'OPEN' },
    data:  { technicianId: Number(user.id), status: 'IN_PROGRESS', claimedAt: new Date() },
  });

  if (result.count === 0) {
    return err('งานนี้ถูกรับไปแล้ว หรือไม่อยู่ในสถานะที่รับได้', 409);
  }

  const updated = await db.maintenanceLog.findUnique({
    where: { id: Number(id) }, include: INCLUDE_FULL,
  });

  await writeAudit({
    userId: Number(user.id), action: 'maintenance.claim',
    targetType: 'MaintenanceLog', targetId: Number(id), after: updated,
    ip: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });

  return ok(updated);
});
