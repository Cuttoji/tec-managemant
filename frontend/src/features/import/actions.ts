'use server';

import { db }               from '@/lib/db';
import { requireSession }   from '@/lib/auth';
import { safeAction }       from '@/lib/errors';
import { assertPermission } from '@/lib/rbac';
import { revalidateAssets } from '@/lib/cache';
import { revalidateTag } from 'next/cache';
import { importCsvSchema }  from './schema';
import { parseBrAdminCsv }  from './bradmin-parser';

export async function importBrAdminCsvAction(content: string, filename = 'upload.csv') {
  return safeAction(async () => {
    const session = await requireSession();
    assertPermission(session.user.role, session.user.permissions, 'import:run');

    const { content: csv } = importCsvSchema.parse({ content, filename });

    const devices = parseBrAdminCsv(csv);
    if (devices.length === 0) {
      throw new Error('ไม่พบข้อมูลอุปกรณ์ในไฟล์ กรุณาตรวจสอบรูปแบบ CSV');
    }

    let created = 0;
    let updated = 0;
    let unmatched = 0;

    for (const device of devices) {
      if (!device.serial) { unmatched++; continue; }

      // Try to find existing asset
      const existing = await db.asset.findUnique({
        where:  { serialNumber: device.serial },
        select: { id: true, assetTag: true, locationId: true, type: true },
      });

      // Resolve location
      let locationId: number | null = null;
      if (device.location) {
        const loc = await db.location.findFirst({
          where: { name: { equals: device.location, mode: 'insensitive' } },
        });
        locationId = loc?.id ?? null;
      }

      // Determine asset type from model name
      const type = inferAssetType(device.model);

      if (existing) {
        // Update existing — only set assetTag if currently empty
        const updateData: Record<string, unknown> = {};
        if (!existing.assetTag && device.node) updateData.assetTag  = device.node;
        if (!existing.locationId && locationId)  updateData.locationId = locationId;
        if (existing.type !== type)              updateData.type     = type;

        if (Object.keys(updateData).length > 0) {
          await db.asset.update({ where: { id: existing.id }, data: updateData });
        }

        // Record page counter
        if (device.pages != null) {
          await db.pageCounterLog.create({
            data: { assetId: existing.id, total: device.pages, source: 'BRADMIN_IMPORT' },
          });
        }
        updated++;
      } else {
        // Create new asset (needs review)
        const asset = await db.asset.create({
          data: {
            serialNumber: device.serial,
            assetTag:     device.node   ?? null,
            model:        device.model  ?? null,
            locationId,
            type,
            needsReview:  true,
          },
        });

        if (device.pages != null) {
          await db.pageCounterLog.create({
            data: { assetId: asset.id, total: device.pages, source: 'BRADMIN_IMPORT' },
          });
        }
        created++;
      }
    }

    // Persist import log
    await db.importLog.create({
      data: {
        filename,
        parsed:         { devices: devices.length, created, updated },
        unmatchedCount: unmatched,
        createdBy:      Number(session.user.id),
      },
    });

    revalidateAssets();
    revalidateTag('review');
    revalidateTag('import-logs');

    return {
      devices: devices.length,
      created,
      updated,
      unmatched,
    };
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inferAssetType(model: string | null): 'PRINTER' | 'COMPUTER' | 'SCANNER' | 'OTHER' {
  if (!model) return 'PRINTER'; // BRAdmin only exports printers
  const m = model.toLowerCase();
  if (m.includes('scan'))  return 'SCANNER';
  if (m.includes('pc') || m.includes('computer') || m.includes('desktop')) return 'COMPUTER';
  return 'PRINTER';
}

export async function getImportLogsAction(page = 1, limit = 20) {
  return safeAction(async () => {
    await requireSession();
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      db.importLog.findMany({
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: { createdByUser: { select: { id: true, name: true } } },
      }),
      db.importLog.count(),
    ]);
    return { items, total, page, limit };
  });
}
