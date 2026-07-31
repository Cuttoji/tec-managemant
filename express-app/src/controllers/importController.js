const fs = require('fs');
const path = require('path');
const bradminParser = require('../services/bradminParser');
const bradminCsvParser = require('../services/bradminCsvParser');
let prisma;
try {
  prisma = require('../db');
} catch (e) {
  prisma = null;
}

exports.handleBrAdminImport = async (req, res) => {
  try {
    const xml = req.body;
    if (!xml || typeof xml !== 'string') {
      return res.status(400).json({ error: 'Missing XML body. Send raw XML with content-type text/xml or application/xml' });
    }

    const dir = path.resolve(__dirname, '../../imports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `bradmin_${Date.now()}.xml`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, xml, 'utf8');

    // Parse generically. Detailed mapping implemented only after receiving a BRAdmin sample.
    const parsed = bradminParser.parse(xml);

    // Save a JSON log of the parsed result for traceability
    const logName = `bradmin_${Date.now()}.json`;
    const logPath = path.join(dir, logName);
    fs.writeFileSync(logPath, JSON.stringify({ file: filename, parsed }, null, 2), 'utf8');

    // Report unmatched (devices where serial is null)
    const unmatched = (parsed.devices || []).filter(d => !d.serial);

    // Persist to DB if Prisma is available
    if (prisma) {
      try {
        await prisma.importLog.create({
          data: {
            filename: filename,
            rawData: xml,
            parsed: JSON.stringify(parsed),
            unmatchedCount: unmatched.length,
            createdBy: req.user ? Number(req.user.id) : null,
          },
        });

        // Upsert assets and page counters for devices with serial
        for (const d of parsed.devices || []) {
          if (!d.serial) continue;

          // choose type heuristically but allow update only for type
          const type = (d.model && (d.model.toLowerCase().includes('printer') || d.model.toLowerCase().includes('brother'))) ? 'PRINTER' : 'COMPUTER';

          // Upsert logic with careful update rules to avoid overwriting dispatcher-managed fields
          const existing = await prisma.asset.findUnique({ where: { serialNumber: d.serial } });

          // resolve or create location only when needed
          let locationId = null;
          if (d.location && d.location.trim()) {
            const locName = d.location.trim();
            let loc = await prisma.location.findFirst({ where: { name: locName } });
            if (!loc) loc = await prisma.location.create({ data: { name: locName } });
            locationId = loc.id;
          }

          if (existing) {
            const toUpdate = {};
            // Only set assetTag if it is currently empty
            if ((!existing.assetTag || existing.assetTag.trim().length === 0) && d.node) {
              toUpdate.assetTag = d.node;
            }
            // Only set locationId if currently null
            if (!existing.locationId && locationId) {
              toUpdate.locationId = locationId;
            }
            // update type if different
            if (existing.type !== type) toUpdate.type = type;

            // Apply update only if we have fields to change
            if (Object.keys(toUpdate).length > 0) {
              await prisma.asset.update({ where: { id: existing.id }, data: toUpdate });
            }

            // Don't reactivate retired assets automatically
            if (existing.isActive === false) {
              // log warning in import log (we already stored parsed JSON)
              console.warn(`Asset with serial ${d.serial} is retired; import did not reactivate.`);
            }

            if (typeof d.pages === 'number' && !Number.isNaN(d.pages)) {
              await prisma.pageCounterLog.create({ data: { assetId: existing.id, total: d.pages } });
            }
          } else {
            // Create a new asset but mark as needsReview so admins can verify before it's considered authoritative
            const created = await prisma.asset.create({ data: {
              serialNumber: d.serial,
              assetTag: d.node || null,
              type,
              locationId: locationId || null,
              needsReview: true,
            }});

            if (typeof d.pages === 'number' && !Number.isNaN(d.pages)) {
              await prisma.pageCounterLog.create({ data: { assetId: created.id, total: d.pages } });
            }
          }
        }
      } catch (err) {
        console.error('DB persist error:', err);
      }
    }

    return res.json({ ok: true, file: filename, parsed, log: logName, unmatchedCount: unmatched.length });
  } catch (err) {
    console.error('Import error:', err);
    return res.status(500).json({ error: 'Failed to import XML', detail: err.message });
  }
};

exports.handleBrAdminCsvImport = async (req, res) => {
  try {
    const csv = req.body;
    if (!csv || typeof csv !== 'string') {
      return res.status(400).json({ error: 'Missing CSV body. Send raw CSV with content-type text/csv or text/plain' });
    }

    const dir = path.resolve(__dirname, '../../imports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `bradmin_${Date.now()}.csv`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, csv, 'utf8');

    const parsed = bradminCsvParser.parse(csv);

    const unmatched = (parsed.devices || []).filter(d => !d.serial);

    if (prisma) {
      try {
        await prisma.importLog.create({ data: {
          filename,
          rawData: csv,
          parsed: JSON.stringify(parsed),
          unmatchedCount: unmatched.length,
          createdBy: req.user ? Number(req.user.id) : null,
        }});

        for (const d of parsed.devices || []) {
          if (!d.serial) continue;
          const type = (d.model && (d.model.toLowerCase().includes('printer') || d.model.toLowerCase().includes('brother'))) ? 'PRINTER' : 'COMPUTER';

          const existing = await prisma.asset.findUnique({ where: { serialNumber: d.serial } });

          // upsert location if provided
          let locationId = null;
          if (d.location && d.location.trim()) {
            const locName = d.location.trim();
            let loc = await prisma.location.findFirst({ where: { name: locName } });
            if (!loc) loc = await prisma.location.create({ data: { name: locName } });
            locationId = loc.id;
          }

          if (existing) {
            const toUpdate = {};
            if ((!existing.assetTag || existing.assetTag.trim().length === 0) && d.node) toUpdate.assetTag = d.node;
            if (!existing.locationId && locationId) toUpdate.locationId = locationId;
            if (existing.type !== type) toUpdate.type = type;
            if (Object.keys(toUpdate).length > 0) await prisma.asset.update({ where: { id: existing.id }, data: toUpdate });
            if (typeof d.pages === 'number' && !Number.isNaN(d.pages)) await prisma.pageCounterLog.create({ data: { assetId: existing.id, total: d.pages } });
          } else {
            const created = await prisma.asset.create({ data: { serialNumber: d.serial, assetTag: d.node || null, type, locationId: locationId || null, needsReview: true } });
            if (typeof d.pages === 'number' && !Number.isNaN(d.pages)) await prisma.pageCounterLog.create({ data: { assetId: created.id, total: d.pages } });
          }
        }
      } catch (err) {
        console.error('DB persist error (csv):', err);
      }
    }

    return res.json({ ok: true, file: filename, parsed, unmatchedCount: unmatched.length });
  } catch (err) {
    console.error('CSV import error:', err);
    return res.status(500).json({ error: 'Failed to import CSV', detail: err.message });
  }
};

exports.listImportLogs = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 25);
    const skip = (page - 1) * limit;
    if (!prisma) return res.status(500).json({ error: 'DB not configured' });

    const [items, total] = await Promise.all([
      prisma.importLog.findMany({ skip, take: limit, orderBy: { id: 'desc' } }),
      prisma.importLog.count(),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error('listImportLogs error', err);
    return res.status(500).json({ error: 'Failed to list import logs' });
  }
};

exports.getImportLog = async (req, res) => {
  try {
    if (!prisma) return res.status(500).json({ error: 'DB not configured' });
    const id = Number(req.params.id);
    const log = await prisma.importLog.findUnique({ where: { id } });
    if (!log) return res.status(404).json({ error: 'ImportLog not found' });
    return res.json(log);
  } catch (err) {
    console.error('getImportLog error', err);
    return res.status(500).json({ error: 'Failed to get import log' });
  }
};
