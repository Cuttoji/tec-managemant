const { XMLParser } = require('fast-xml-parser');

const KEY_MAP = {
  serial: ['serial', 'serialnumber', 'sn', 'machineid'],
  pages: ['page', 'pages', 'totalpages', 'totalpagecount', 'pagecount', 'total'],
  ip: ['ip', 'ipaddress', 'ipaddr', 'ip_address', 'ipaddress'],
  model: ['model', 'product', 'device', 'modelname', 'devicename'],
  mac: ['mac', 'macaddress', 'mac_address'],
  hostname: ['hostname', 'host', 'name'],
};

function normKey(k) {
  return String(k || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function findValueByPatterns(obj, patterns) {
  if (!obj || typeof obj !== 'object') return null;
  for (const k of Object.keys(obj)) {
    const nk = normKey(k);
    for (const p of patterns) {
      if (nk.includes(p)) {
        const v = obj[k];
        if (v === undefined || v === null) continue;
        if (typeof v === 'object') continue;
        return String(v).trim();
      }
    }
  }
  return null;
}

function extractDeviceObject(obj) {
  const device = {};
  device.serial = findValueByPatterns(obj, KEY_MAP.serial) || null;
  device.model = findValueByPatterns(obj, KEY_MAP.model) || null;
  device.ip = findValueByPatterns(obj, KEY_MAP.ip) || null;
  device.mac = findValueByPatterns(obj, KEY_MAP.mac) || null;
  device.hostname = findValueByPatterns(obj, KEY_MAP.hostname) || null;
  const pagesRaw = findValueByPatterns(obj, KEY_MAP.pages);
  if (pagesRaw) {
    const n = Number(String(pagesRaw).replace(/[^0-9]/g, ''));
    device.pages = Number.isNaN(n) ? null : n;
  } else {
    device.pages = null;
  }
  return device;
}

function collectDevices(node) {
  const found = [];

  function recurse(o) {
    if (!o) return;
    if (Array.isArray(o)) {
      o.forEach(item => recurse(item));
      return;
    }
    if (typeof o !== 'object') return;

    // If object looks like a device (has serial or ip or model), extract
    const candidate = extractDeviceObject(o);
    if (candidate.serial || candidate.ip || candidate.model) {
      found.push({ ...candidate, raw: o });
    }

    for (const k of Object.keys(o)) {
      const v = o[k];
      if (Array.isArray(v)) v.forEach(item => recurse(item));
      else if (v && typeof v === 'object') recurse(v);
    }
  }

  recurse(node);
  return found;
}

/**
 * Parse BRAdmin-style XML and perform robust heuristic extraction for common device
 * fields. This function intentionally uses heuristics and best-effort mapping so that
 * it can work with different vendor XML variations. For authoritative mapping,
 * provide a BRAdmin sample XML and we can update this module to a strict tag map.
 */
exports.parse = (xmlText) => {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  let parsed;
  try {
    parsed = parser.parse(xmlText);
  } catch (err) {
    throw new Error('Invalid XML: ' + err.message);
  }

  const devices = collectDevices(parsed);

  return {
    mappingImplemented: false,
    message: 'Heuristic extraction complete. Provide a BRAdmin sample XML to implement authoritative mapping.',
    devices,
    parsed,
  };
};
