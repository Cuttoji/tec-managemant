import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import { handle, ok, err } from '@/lib/apiResponse';
import { requireApiAdmin } from '@/lib/apiAuth';
import { parseBrAdminCsv } from '@/lib/bradminCsvParser';

const IMPORT_DIR = path.join(process.cwd(), 'imports');

async function ensureDir(dir: string) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

async function upsertDevices(devices: any[]) {
  for (const d of devices) {
    if (!d.serial) continue;

    const type =
      d.model && (d.model.toLowerCase().includes('printer') || d.model.toLowerCase().includes('brother'))
        ? 'PRINTER'
        : 'COMPUTER';

    let locationId: number | null = null;
    if (d.location?.trim()) {
      const locName = d.location.trim();
      let loc = await db.location.findFirst({ where: { name: locName } });
      if (!loc) loc = await db.location.create({ data: { name: locName } });
      locationId = loc.id;
    }

    const existing = await db.asset.findUnique({ where: { serialNumber: d.serial } });

    if (existing) {
      const toUpdate: any = {};
      if (!existing.assetTag?.trim() && d.node) toUpdate.assetTag = d.node;
      if (!existing.locationId && locationId)    toUpdate.locationId = locationId;
      if (existing.type !== type)                toUpdate.type = type;
      if (Object.keys(toUpdate).length > 0) {
        await db.asset.update({ where: { id: existing.id }, data: toUpdate });
      }
      if (typeof d.pages === 'number' && !Number.isNaN(d.pages)) {
        await db.pageCounterLog.create({ data: { assetId: existing.id, total: d.pages } });
      }
    } else {
      const created = await db.asset.create({
        data: { serialNumber: d.serial, assetTag: d.node ?? null, type, locationId, needsReview: true },
      });
      if (typeof d.pages === 'number' && !Number.isNaN(d.pages)) {
        await db.pageCounterLog.create({ data: { assetId: created.id, total: d.pages } });
      }
    }
  }
}

// POST /api/import/bradmin/csv  — raw CSV body
export const POST = handle(async (req: NextRequest) => {
  const { user } = await requireApiAdmin(req);

  const csv = await req.text();
  if (!csv) return err('Missing CSV body', 400);

  await ensureDir(IMPORT_DIR);
  const filename = `bradmin_${Date.now()}.csv`;
  await writeFile(path.join(IMPORT_DIR, filename), csv, 'utf8');

  const parsed    = parseBrAdminCsv(csv);
  const unmatched = (parsed.devices ?? []).filter((d: any) => !d.serial);

  try {
    await db.importLog.create({
      data: {
        filename,
        filePath:      path.join(IMPORT_DIR, filename),
        parsed:        JSON.stringify(parsed),
        unmatchedCount: unmatched.length,
        createdBy:     Number(user.id),
      },
    });
    await upsertDevices(parsed.devices ?? []);
  } catch (e: any) {
    console.error('[import/bradmin/csv] DB error:', e.message);
  }

  return ok({ ok: true, file: filename, parsed, unmatchedCount: unmatched.length });
});
