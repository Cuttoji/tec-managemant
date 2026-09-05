import { db } from '@/lib/db';
import type { TicketFiltersInput } from './schema';

// ─── Includes ─────────────────────────────────────────────────────────────────

const TICKET_INCLUDE = {
  asset: {
    include: {
      location:    { select: { id: true, name: true } },
      pageCounters: { orderBy: { recordedAt: 'desc' as const }, take: 1 },
    },
  },
  dispatcher:  { select: { id: true, name: true, email: true, role: true } },
  technician:  { select: { id: true, name: true, email: true, role: true } },
  reviewer:    { select: { id: true, name: true, email: true, role: true } },
  components:  { orderBy: { id: 'asc' as const } },
  loanerAsset: { select: { id: true, assetTag: true, serialNumber: true, model: true } },
} as const;

// ─── List ──────────────────────────────────────────────────────────────────────

export async function listTickets(filters: TicketFiltersInput) {
  const { status, technicianId, assetId, dateFrom, dateTo, page, limit } = filters;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status)       where.status       = status;
  if (technicianId) where.technicianId = technicianId;
  if (assetId)      where.assetId      = assetId;

  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo   ? { lte: new Date(`${dateTo}T23:59:59Z`) } : {}),
    };
  }

  const [items, total] = await Promise.all([
    db.maintenanceLog.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: TICKET_INCLUDE,
    }),
    db.maintenanceLog.count({ where }),
  ]);

  return { items, total, page, limit };
}

// ─── Get one ──────────────────────────────────────────────────────────────────

export async function getTicket(id: number) {
  return db.maintenanceLog.findUnique({
    where:   { id },
    include: TICKET_INCLUDE,
  });
}

// ─── Stats for dashboard ──────────────────────────────────────────────────────

export async function getTicketStats() {
  const [open, inProgress, completed, reviewed] = await Promise.all([
    db.maintenanceLog.count({ where: { status: 'OPEN' } }),
    db.maintenanceLog.count({ where: { status: 'IN_PROGRESS' } }),
    db.maintenanceLog.count({ where: { status: 'COMPLETED' } }),
    db.maintenanceLog.count({ where: { status: 'REVIEWED' } }),
  ]);
  return { open, inProgress, completed, reviewed };
}

// ─── Printer consumable summary ───────────────────────────────────────────────

export async function getPrinterConsumableSummary(from?: string, to?: string) {
  const printerAssets = await db.asset.findMany({
    where: { type: 'PRINTER', isActive: true },
    select: { id: true },
  });
  const printerIds = printerAssets.map((a: any) => a.id);

  const where: Record<string, unknown> = {
    assetId:    { in: printerIds },
    status:     { in: ['COMPLETED', 'REVIEWED'] },
    components: { some: {} },
  };

  if (from || to) {
    where.completedAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to   ? { lte: new Date(`${to}T23:59:59Z`) } : {}),
    };
  }

  const jobs = await db.maintenanceLog.findMany({
    where,
    include: {
      asset:      { select: { id: true, assetTag: true, model: true, type: true } },
      technician: { select: { id: true, name: true } },
      components: true,
    },
    orderBy: { completedAt: 'desc' },
  });

  // Flatten components with context
  const rows = jobs.flatMap((m: any) =>
    m.components.map((c: any) => ({
      maintenanceId: m.id,
      assetId:       m.assetId,
      assetTag:      m.asset.assetTag,
      model:         m.asset.model,
      part:          c.part,
      quantity:      c.quantity,
      completedAt:   m.completedAt,
      technician:    m.technician?.name ?? '—',
      pageAtRepair:  m.totalPageAtRepair,
    }))
  );

  // Toner/Drum totals
  const tonerTotal = rows
    .filter((r: any) => /toner/i.test(r.part))
    .reduce((s: number, r: any) => s + r.quantity, 0);

  const drumTotal = rows
    .filter((r: any) => /drum/i.test(r.part))
    .reduce((s: number, r: any) => s + r.quantity, 0);

  return {
    rows,
    totals: { toner: tonerTotal, drum: drumTotal, items: rows.length },
  };
}
