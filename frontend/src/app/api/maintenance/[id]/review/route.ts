import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok, err, writeAudit } from '@/lib/apiResponse';
import { requireApiAdmin } from '@/lib/apiAuth';
import { reviewMaintenanceSchema } from '@/lib/schemas';

type Ctx = { params: Promise<{ id: string }> };

const INCLUDE_FULL = {
  asset:      { include: { location: true } },
  dispatcher: { select: { id: true, name: true, email: true, role: true } },
  technician: { select: { id: true, name: true, email: true, role: true } },
  reviewer:   { select: { id: true, name: true, email: true, role: true } },
  loanerAsset: { select: { id: true, assetTag: true, serialNumber: true, model: true } },
  components: true,
} as const;

// POST /api/maintenance/[id]/review
export const POST = handle(async (req: NextRequest, ctx: Ctx) => {
  const { user } = await requireApiAdmin(req);
  const { id } = await ctx.params;

  const body = reviewMaintenanceSchema.parse(await req.json());

  const existing = await db.maintenanceLog.findUnique({ where: { id: Number(id) } });
  if (!existing) return err('Not found', 404);
  if (existing.status !== 'COMPLETED') return err('งานนี้ยังไม่ถูกปิดโดยช่าง', 409);

  const data = body.approved
    ? {
        status:      'REVIEWED' as const,
        reviewedBy:  Number(user.id),
        reviewedAt:  new Date(),
        reviewNotes: body.reviewNotes ?? null,
      }
    : {
        status:            'OPEN' as const,
        technicianId:      null as null,
        claimedAt:         null as null,
        completedAt:       null as null,
        repairDetails:     null as null,
        symptom:           null as null,
        partReplacedAt:    null as null,
        brand:             null as null,
        totalPageAtRepair: null as null,
        usedLoaner:        false,
        loanerAssetId:     null as null,
        loanerPageStart:   null as null,
        loanerPageEnd:     null as null,
        reviewedBy:        Number(user.id),
        reviewedAt:        new Date(),
        reviewNotes:       body.reviewNotes ?? 'ซ่อมไม่ผ่าน ให้เปิดงานใหม่',
      };

  const updated = await db.maintenanceLog.update({
    where: { id: Number(id) }, data, include: INCLUDE_FULL,
  });

  await writeAudit({
    userId: Number(user.id), action: 'maintenance.review',
    targetType: 'MaintenanceLog', targetId: Number(id), after: updated,
    ip: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });

  return ok(updated);
});
