const os = require('os');

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

function normalizeSerial(s) {
  if (!s) return null;
  let v = String(s).trim();
  // Remove control characters
  v = v.replace(/[^\x20-\x7E]/g, '');
  if (v.length === 0) return null;
  if (v.length > 128) v = v.slice(0, 128);
  return v;
}

function sanitizeCell(raw) {
  if (raw == null) return null;
  let s = String(raw);
  // Remove BOM if present
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
  s = s.trim();
  // Remove non-printable control characters
  s = s.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
  if (s.length === 0) return null;
  // Mitigate CSV/Excel formula injection by prefixing with a single quote
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return s;
}

exports.parse = (csvText) => {
  const lines = String(csvText).split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { devices: [], parsed: null };

  const header = parseCSVLine(lines[0]);
  const idxOf = (name) => {
    const i = header.findIndex(h => h && h.toLowerCase() === name.toLowerCase());
    return i >= 0 ? i : -1;
  };

  const iSerial = idxOf('Serial Number');
  const iTotal = idxOf('Total Page Count');
  const iModel = idxOf('Model Name');
  const iLocation = idxOf('Location');
  const iIP = idxOf('IP Address');
  const iNode = idxOf('Node Name');
  const iMac = idxOf('MAC Address');

  const devices = [];

  for (let r = 1; r < lines.length; r++) {
    const cols = parseCSVLine(lines[r]);
    const serialRaw = iSerial >= 0 ? cols[iSerial] : null;
    const serial = normalizeSerial(sanitizeCell(serialRaw));
    const totalRaw = iTotal >= 0 ? cols[iTotal] : null;
    const pages = totalRaw ? Number(String(sanitizeCell(totalRaw)).replace(/[^0-9]/g, '')) : null;
    const model = iModel >= 0 ? sanitizeCell(cols[iModel]) : null;
    const location = iLocation >= 0 ? sanitizeCell(cols[iLocation]) : null;
    const ip = iIP >= 0 ? sanitizeCell(cols[iIP]) : null;
    const node = iNode >= 0 ? sanitizeCell(cols[iNode]) : null;
    const mac = iMac >= 0 ? sanitizeCell(cols[iMac]) : null;

    devices.push({ serial, model, location, ip, node, mac, pages, raw: cols });
  }

  return { devices, parsed: { header, count: devices.length } };
};
