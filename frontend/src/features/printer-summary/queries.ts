import { db }   from '@/lib/db';
import { TAGS }  from '@/lib/cache';
import { unstable_cache } from 'next/cache';

export type Site = 'oboj' | 'taksin';

function getSite(model: string | null): Site {
  return /brother/i.test(model ?? '') ? 'oboj' : 'taksin';
}

// ─── Main summary query ───────────────────────────────────────────────────────

async function fetchPrinterSummary(from?: string, to?: string) {
  const printers = await db.asset.findMany({
    where: { type: 'PRINTER', isActive: true },
    select: { id: true },
  });
  const printerIds = printers.map((p: any) => p.id);

  const where: Record<string, unknown> = {
    assetId:    { in: printerIds },
    status:     { in: ['COMPLETED', 'REVIEWED'] },
    components: { some: {} },
  };

  if (from || to) {
    where.completedAt = {
      ...(from ? { gte: new Date(from) }              : {}),
      ...(to   ? { lte: new Date(`${to}T23:59:59Z`) } : {}),
    };
  }

  const jobs = await db.maintenanceLog.findMany({
    where,
    include: {
      asset:      { select: { id: true, assetTag: true, model: true } },
      technician: { select: { id: true, name: true } },
      components: true,
    },
    orderBy: { completedAt: 'desc' },
  });

  // Flatten components into rows
  const rows = jobs.flatMap((m: any) =>
    m.components.map((c: any) => ({
      maintenanceId: m.id,
      assetId:       m.assetId,
      assetTag:      m.asset.assetTag,
      model:         m.asset.model,
      site:          getSite(m.asset.model) as Site,
      part:          c.part,
      quantity:      c.quantity,
      completedAt:   m.completedAt?.toISOString() ?? null,
      technician:    m.technician?.name ?? '—',
      pageAtRepair:  m.totalPageAtRepair,
    }))
  );

  // Monthly breakdown for charts: { "2026-05": { toner: 1, drum: 0 } }
  const monthly: Record<string, { toner: number; drum: number }> = {};
  rows.forEach((r: any) => {
    if (!r.completedAt) return;
    const ym = r.completedAt.slice(0, 7);
    if (!monthly[ym]) monthly[ym] = { toner: 0, drum: 0 };
    if (/toner/i.test(r.part))     monthly[ym].toner += r.quantity;
    else if (/drum/i.test(r.part)) monthly[ym].drum  += r.quantity;
  });

  const tonerTotal = rows.filter((r: any) => /toner/i.test(r.part)).reduce((s: number, r: any) => s + r.quantity, 0);
  const drumTotal  = rows.filter((r: any) => /drum/i.test(r.part)).reduce((s: number, r: any) => s + r.quantity, 0);

  return {
    rows,
    monthly,
    totals: {
      toner:    tonerTotal,
      drum:     drumTotal,
      items:    rows.length,
      printers: new Set(rows.map((r: any) => r.assetId)).size,
    },
    // Pre-split by site for the tabs
    oboj:   rows.filter((r: any) => r.site === 'oboj'),
    taksin: rows.filter((r: any) => r.site === 'taksin'),
  };
}

/**
 * Cached printer summary — 5-minute TTL.
 * Bust with revalidateTag('printer-summary') after any maintenance mutation.
 */
export const getCachedPrinterSummary = (from?: string, to?: string) =>
  unstable_cache(
    () => fetchPrinterSummary(from, to),
    [`printer-summary:${from ?? 'all'}:${to ?? 'all'}`],
    { tags: [TAGS.summary, TAGS.tickets], revalidate: 300 }
  )();
