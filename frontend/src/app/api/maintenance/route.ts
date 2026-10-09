import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok, writeAudit } from '@/lib/apiResponse';
import { requireApiAuth, requireApiAdmin } from '@/lib/apiAuth';
import { createMaintenanceSchema } from '@/lib/schemas';

const INCLUDE_FULL = {
  asset:      { include: { location: true } },
  dispatcher: { select: { id: true, name: true, email: true, role: true } },
  technician: { select: { id: true, name: true, email: true, role: true } },
  reviewer:   { select: { id: true, name: true, email: true, role: true } },
  loanerAsset: { select: { id: true, assetTag: true, serialNumber: true, model: true } },
  components: true,
} as const;

// GET /api/maintenance
export const GET = handle(async (req: NextRequest) => {
  await requireApiAuth(req);

  const sp     = req.nextUrl.searchParams;
  const page   = Math.max(1, Number(sp.get('page')   ?? 1));
  const limit  = Math.min(100, Number(sp.get('limit') ?? 25));
  const skip   = (page - 1) * limit;

  const where: any = {};
  if (sp.get('status'))   where.status = sp.get('status');
  if (sp.get('dateFrom') || sp.get('dateTo')) {
    where.createdAt = {};
    if (sp.get('dateFrom')) where.createdAt.gte = new Date(sp.get('dateFrom')!);
    if (sp.get('dateTo'))   where.createdAt.lte = new Date(sp.get('dateTo')! + 'T23:59:59Z');
  }

  const [items, total] = await Promise.all([
    db.maintenanceLog.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: INCLUDE_FULL,
    }),
    db.maintenanceLog.count({ where }),
  ]);

  return ok({ items, total, page, limit });
});

// POST /api/maintenance
export const POST = handle(async (req: NextRequest) => {
  const { user } = await requireApiAdmin(req);
  const body = createMaintenanceSchema.parse(await req.json());

  const m = await db.maintenanceLog.create({
    data: {
      assetId:      body.assetId,
      issueDetails: body.issueDetails,
      dispatcherId: Number(user.id),
      status:       'OPEN',
    },
  });

  await writeAudit({
    userId: Number(user.id), action: 'maintenance.create',
    targetType: 'MaintenanceLog', targetId: m.id, after: m,
    ip: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });

  return ok(m, 201);
});
