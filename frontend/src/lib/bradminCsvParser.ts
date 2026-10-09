/**
 * bradminCsvParser.ts — BRAdmin CSV parser
 * Ported from express-app/src/services/bradminCsvParser.js
 */

function parseCSVLine(line: string): (string | null)[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
      continue;
    }
    if (ch === ',' && !inQuotes) { result.push(cur); cur = ''; continue; }
    cur += ch;
  }
  result.push(cur);
  return result.map((s) => (s === '' ? null : s.trim()));
}

function normalizeSerial(s: string | null): string | null {
  if (!s) return null;
  let v = String(s).trim().replace(/[^\x20-\x7E]/g, '');
  if (v.length === 0) return null;
  return v.length > 128 ? v.slice(0, 128) : v;
}

function sanitizeCell(raw: string | null): string | null {
  if (raw == null) return null;
  let s = String(raw);
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  s = s.trim().replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
  if (s.length === 0) return null;
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return s;
}

export function parseBrAdminCsv(csvText: string) {
  const lines = String(csvText).split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { devices: [], parsed: null };

  const header = parseCSVLine(lines[0]) as string[];
  const idxOf  = (name: string) =>
    header.findIndex((h) => h && h.toLowerCase() === name.toLowerCase());

  const iSerial   = idxOf('Serial Number');
  const iTotal    = idxOf('Total Page Count');
  const iModel    = idxOf('Model Name');
  const iLocation = idxOf('Location');
  const iIP       = idxOf('IP Address');
  const iNode     = idxOf('Node Name');
  const iMac      = idxOf('MAC Address');

  const devices = lines.slice(1).map((line) => {
    const cols     = parseCSVLine(line);
    const serial   = normalizeSerial(sanitizeCell(iSerial   >= 0 ? cols[iSerial]   ?? null : null));
    const totalRaw = iTotal >= 0 ? cols[iTotal] ?? null : null;
    const pages    = totalRaw ? Number(String(sanitizeCell(totalRaw)).replace(/[^0-9]/g, '')) : null;
    return {
      serial,
      model:    iModel    >= 0 ? sanitizeCell(cols[iModel]    ?? null) : null,
      location: iLocation >= 0 ? sanitizeCell(cols[iLocation] ?? null) : null,
      ip:       iIP       >= 0 ? sanitizeCell(cols[iIP]       ?? null) : null,
      node:     iNode     >= 0 ? sanitizeCell(cols[iNode]     ?? null) : null,
      mac:      iMac      >= 0 ? sanitizeCell(cols[iMac]      ?? null) : null,
      pages:    Number.isNaN(pages) ? null : pages,
      raw:      cols,
    };
  });

  return { devices, parsed: { header, count: devices.length } };
}
