const fs = require('fs');
const path = require('path');
const prisma = require('../db');

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'; i++; // escaped quote
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  result.push(cur);
  return result.map(s => s === '' ? null : s.trim());
}

function sanitizeCell(raw) {
  if (raw == null) return null;
  let s = String(raw);
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
  s = s.trim();
  s = s.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return s.length === 0 ? null : s;
}

async function importCsv(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.error('File not found:', abs);
    process.exit(1);
  }

  const text = fs.readFileSync(abs, 'utf8');
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const header = parseCSVLine(lines[0]);

  const idx = (name) => {
    const i = header.findIndex(h => h && h.toLowerCase() === name.toLowerCase());
    return i >= 0 ? i : -1;
  };

  const iSerial = idx('Serial Number');
  const iTotal = idx('Total Page Count');
  const iModel = idx('Model Name');
  const iLocation = idx('Location');
  const iIP = idx('IP Address');
  const iNode = idx('Node Name');

  let created = 0;
  let updated = 0;
  let unmatched = 0;

  for (let r = 1; r < lines.length; r++) {
    const cols = parseCSVLine(lines[r]);
    const serial = iSerial >= 0 ? sanitizeCell(cols[iSerial]) : null;
    const totalStr = iTotal >= 0 ? sanitizeCell(cols[iTotal]) : null;
    const model = iModel >= 0 ? sanitizeCell(cols[iModel]) : null;
    const location = iLocation >= 0 ? sanitizeCell(cols[iLocation]) : null;
    const ip = iIP >= 0 ? sanitizeCell(cols[iIP]) : null;
    const node = iNode >= 0 ? sanitizeCell(cols[iNode]) : null;

    const pages = totalStr ? Number(String(totalStr).replace(/[^0-9]/g, '')) : null;

    if (!serial) { unmatched++; continue; }

    const type = (model && model.toLowerCase().includes('printer')) || (model && model.toLowerCase().includes('brother')) ? 'PRINTER' : 'COMPUTER';

    try {
      const existing = await prisma.asset.findUnique({ where: { serialNumber: serial } });
      if (existing) {
        const toUpdate = {};
        if ((!existing.assetTag || existing.assetTag.trim().length === 0) && node) toUpdate.assetTag = node;
        if ((!existing.locationId || existing.locationId === null) && location) {
          let loc = await prisma.location.findFirst({ where: { name: location } });
          if (!loc) loc = await prisma.location.create({ data: { name: location } });
          toUpdate.locationId = loc.id;
        }
        if (existing.type !== type) toUpdate.type = type;
        if (Object.keys(toUpdate).length > 0) {
          await prisma.asset.update({ where: { id: existing.id }, data: toUpdate });
          updated++;
        }
        if (pages !== null && !Number.isNaN(pages)) await prisma.pageCounterLog.create({ data: { assetId: existing.id, total: pages } });
      } else {
        let locationId = null;
        if (location) {
          let loc = await prisma.location.findFirst({ where: { name: location } });
          if (!loc) loc = await prisma.location.create({ data: { name: location } });
          locationId = loc.id;
        }
        const createdAsset = await prisma.asset.create({ data: { serialNumber: serial, assetTag: node || null, type, locationId, needsReview: true } });
        if (pages !== null && !Number.isNaN(pages)) await prisma.pageCounterLog.create({ data: { assetId: createdAsset.id, total: pages } });
        created++;
      }
    } catch (err) {
      console.error('DB error for serial', serial, err.message);
    }
  }

  // create import log
  try {
    await prisma.importLog.create({ data: {
      filename: path.basename(abs),
      rawData: text,
      parsed: JSON.stringify({ imported: created, unmatched }),
      unmatchedCount: unmatched,
    }});
  } catch (err) {
    console.error('Failed to create import log:', err.message);
  }

  console.log('Import complete. imported:', created, 'unmatched:', unmatched);
}

if (require.main === module) {
  const fileArg = process.argv[2] || 'c:/Users/ACER/Downloads/DevicesList 27-7-2569.csv';
  importCsv(fileArg).then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}
