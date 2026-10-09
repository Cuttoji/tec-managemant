/**
 * bradminParser.ts — BRAdmin XML heuristic parser
 * Ported from express-app/src/services/bradminParser.js
 */
import { XMLParser } from 'fast-xml-parser';

const KEY_MAP: Record<string, string[]> = {
  serial:   ['serial', 'serialnumber', 'sn', 'machineid'],
  pages:    ['page', 'pages', 'totalpages', 'totalpagecount', 'pagecount', 'total'],
  ip:       ['ip', 'ipaddress', 'ipaddr', 'ip_address'],
  model:    ['model', 'product', 'device', 'modelname', 'devicename'],
  mac:      ['mac', 'macaddress', 'mac_address'],
  hostname: ['hostname', 'host', 'name'],
};

function normKey(k: string) {
  return String(k ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function findValueByPatterns(obj: Record<string, any>, patterns: string[]): string | null {
  if (!obj || typeof obj !== 'object') return null;
  for (const k of Object.keys(obj)) {
    const nk = normKey(k);
    for (const p of patterns) {
      if (nk.includes(p)) {
        const v = obj[k];
        if (v === undefined || v === null || typeof v === 'object') continue;
        return String(v).trim();
      }
    }
  }
  return null;
}

function extractDevice(obj: Record<string, any>) {
  const device: Record<string, any> = {};
  device.serial   = findValueByPatterns(obj, KEY_MAP.serial)   ?? null;
  device.model    = findValueByPatterns(obj, KEY_MAP.model)    ?? null;
  device.ip       = findValueByPatterns(obj, KEY_MAP.ip)       ?? null;
  device.mac      = findValueByPatterns(obj, KEY_MAP.mac)      ?? null;
  device.hostname = findValueByPatterns(obj, KEY_MAP.hostname) ?? null;
  const pagesRaw  = findValueByPatterns(obj, KEY_MAP.pages);
  if (pagesRaw) {
    const n = Number(String(pagesRaw).replace(/[^0-9]/g, ''));
    device.pages = Number.isNaN(n) ? null : n;
  } else {
    device.pages = null;
  }
  return device;
}

function collectDevices(node: any): any[] {
  const found: any[] = [];
  function recurse(o: any) {
    if (!o) return;
    if (Array.isArray(o)) { o.forEach(recurse); return; }
    if (typeof o !== 'object') return;
    const candidate = extractDevice(o);
    if (candidate.serial || candidate.ip || candidate.model) {
      found.push({ ...candidate, raw: o });
    }
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (Array.isArray(v)) v.forEach(recurse);
      else if (v && typeof v === 'object') recurse(v);
    }
  }
  recurse(node);
  return found;
}

export function parseBrAdminXml(xmlText: string) {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  let parsed: any;
  try {
    parsed = parser.parse(xmlText);
  } catch (err: any) {
    throw new Error('Invalid XML: ' + err.message);
  }
  const devices = collectDevices(parsed);
  return {
    mappingImplemented: false,
    message: 'Heuristic extraction complete.',
    devices,
    parsed,
  };
}
