/**
 * BRAdmin CSV / XML Parser
 * Parses export files from BRAdmin Pro and BRAdmin Light.
 * Extracted from the original Express importController.js logic.
 */

export interface BrAdminDevice {
  serial:    string;
  node:      string | null;   // hostname / asset tag
  model:     string | null;
  pages:     number | null;   // total page counter
  location:  string | null;
  ipAddress: string | null;
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

export function parseBrAdminCsv(csv: string): BrAdminDevice[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  // Find header row (case-insensitive)
  const headerLine = lines[0];
  const headers = headerLine.split(',').map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''));

  const idx = {
    serial:   headers.findIndex((h) => h.includes('serial')),
    node:     headers.findIndex((h) => h.includes('node') || h.includes('hostname')),
    model:    headers.findIndex((h) => h.includes('model')),
    pages:    headers.findIndex((h) => h.includes('page') || h.includes('total')),
    location: headers.findIndex((h) => h.includes('location')),
    ip:       headers.findIndex((h) => h.includes('ip')),
  };

  const devices: BrAdminDevice[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length < 2) continue;

    const serial = clean(cols[idx.serial]);
    if (!serial) continue; // serial is the unique identifier

    devices.push({
      serial,
      node:      idx.node     >= 0 ? clean(cols[idx.node])   : null,
      model:     idx.model    >= 0 ? clean(cols[idx.model])   : null,
      pages:     idx.pages    >= 0 ? parseIntSafe(cols[idx.pages]) : null,
      location:  idx.location >= 0 ? clean(cols[idx.location]) : null,
      ipAddress: idx.ip       >= 0 ? clean(cols[idx.ip])      : null,
    });
  }

  return devices;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuote = false;

  for (const ch of line) {
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function clean(val: string | undefined): string | null {
  if (!val) return null;
  const s = val.trim().replace(/^"|"$/g, '');
  return s || null;
}

function parseIntSafe(val: string | undefined): number | null {
  if (!val) return null;
  const n = parseInt(val.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? null : n;
}
