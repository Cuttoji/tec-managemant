// Mock API handler — intercepts all API calls when NEXT_PUBLIC_MOCK=true
import {
  MOCK_ASSETS, MOCK_MAINTENANCE, MOCK_USERS, MOCK_LOCATIONS,
  MOCK_IMPORT_LOGS, MOCK_USER_ADMIN,
} from './mockData';

function delay(ms = 300) {
  return new Promise(r => setTimeout(r, ms));
}

function paginate<T>(items: T[], page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  return { items: items.slice(skip, skip + limit), total: items.length, page, limit };
}

export async function mockGet(path: string): Promise<any> {
  await delay();
  const url = new URL('http://x' + path);
  const p   = url.pathname;

  // GET /assets
  if (p === '/assets') {
    const model    = url.searchParams.get('model')?.toLowerCase();
    const assetTag = url.searchParams.get('assetTag')?.toLowerCase();
    const serial   = url.searchParams.get('serial')?.toLowerCase();
    const needsRev = url.searchParams.get('needsReview');
    const page     = Number(url.searchParams.get('page')) || 1;
    const limit    = Number(url.searchParams.get('limit')) || 20;

    let items = [...MOCK_ASSETS];
    if (model)    items = items.filter(a => a.model?.toLowerCase().includes(model));
    if (assetTag) items = items.filter(a => a.assetTag?.toLowerCase().includes(assetTag));
    if (serial)   items = items.filter(a => a.serialNumber?.toLowerCase().includes(serial));
    if (needsRev === 'true') items = items.filter(a => a.needsReview);
    return paginate(items, page, limit);
  }

  // GET /assets/:id
  const assetMatch = p.match(/^\/assets\/(\d+)$/);
  if (assetMatch) {
    const id = Number(assetMatch[1]);
    const asset = MOCK_ASSETS.find(a => a.id === id);
    if (!asset) throw new Error('Asset not found');
    return asset;
  }

  // GET /assets/:id/maintenance
  const assetMaintMatch = p.match(/^\/assets\/(\d+)\/maintenance$/);
  if (assetMaintMatch) {
    const assetId = Number(assetMaintMatch[1]);
    const items = MOCK_MAINTENANCE.filter(m => m.assetId === assetId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { items, total: items.length };
  }

  // GET /maintenance
  if (p === '/maintenance') {
    const status = url.searchParams.get('status');
    const page   = Number(url.searchParams.get('page')) || 1;
    const limit  = Number(url.searchParams.get('limit')) || 20;
    let items    = [...MOCK_MAINTENANCE];
    if (status) items = items.filter(m => m.status === status);
    return paginate(items, page, limit);
  }

  // GET /users
  if (p === '/users') return { items: MOCK_USERS };

  // GET /locations
  if (p === '/locations') return { items: MOCK_LOCATIONS };

  // GET /locations/:id
  const locMatch = p.match(/^\/locations\/(\d+)$/);
  if (locMatch) {
    const loc = MOCK_LOCATIONS.find(l => l.id === Number(locMatch[1]));
    if (!loc) throw new Error('Location not found');
    return loc;
  }

  // GET /import/logs
  if (p === '/import/logs') {
    const page  = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 20;
    return paginate(MOCK_IMPORT_LOGS, page, limit);
  }

  // GET /reports/printer-summary
  if (p === '/reports/printer-summary') {
    const fromParam = url.searchParams.get('from');
    const toParam   = url.searchParams.get('to');

    const printerAssets = MOCK_ASSETS.filter(a => a.type === 'PRINTER');
    const printerIds    = new Set(printerAssets.map(a => a.id));

    let jobs = MOCK_MAINTENANCE.filter(m =>
      printerIds.has(m.assetId) &&
      (m.status === 'COMPLETED' || m.status === 'REVIEWED') &&
      m.components.length > 0
    );

    if (fromParam) jobs = jobs.filter(m => new Date(m.createdAt) >= new Date(fromParam));
    if (toParam)   jobs = jobs.filter(m => new Date(m.createdAt) <= new Date(toParam + 'T23:59:59Z'));

    // flatten components per job with asset info
    const rows = jobs.flatMap(m =>
      m.components.map(c => ({
        maintenanceId: m.id,
        assetId:       m.assetId,
        assetTag:      m.asset.assetTag,
        model:         m.asset.model,
        part:          c.part,
        quantity:      c.quantity,
        completedAt:   m.completedAt,
        technician:    m.technician?.name ?? '—',
        pageAtRepair:  m.totalPageAtRepair,
      }))
    ).sort((a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime());

    // summary counts by part keyword
    const partCount: Record<string, number> = {};
    rows.forEach(r => {
      const key = /toner/i.test(r.part) ? 'Toner' : /drum/i.test(r.part) ? 'Drum' : r.part;
      partCount[key] = (partCount[key] ?? 0) + r.quantity;
    });

    return { rows, summary: partCount, total: rows.length };
  }

  // GET /reports/printer-dashboard  — per-printer lifetime consumable counts
  if (p === '/reports/printer-dashboard') {
    const printerAssets = MOCK_ASSETS.filter(a => a.type === 'PRINTER');

    const printers = printerAssets.map(asset => {
      const jobs = MOCK_MAINTENANCE.filter(m =>
        m.assetId === asset.id &&
        (m.status === 'COMPLETED' || m.status === 'REVIEWED')
      );

      let tonerCount = 0;
      let drumCount  = 0;
      let otherCount = 0;
      const lastJobs: any[] = [];

      jobs.forEach(m => {
        m.components.forEach((c: any) => {
          if (/toner/i.test(c.part)) tonerCount += c.quantity;
          else if (/drum/i.test(c.part)) drumCount += c.quantity;
          else otherCount += c.quantity;
        });
        if (m.completedAt) lastJobs.push(m);
      });

      lastJobs.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
      const lastMaint = lastJobs[0] ?? null;

      // build last 12 months toner/drum counts for mini chart
      const monthly: Record<string, { toner: number; drum: number }> = {};
      jobs.forEach(m => {
        if (!m.completedAt) return;
        const ym = m.completedAt.slice(0, 7); // "2026-05"
        if (!monthly[ym]) monthly[ym] = { toner: 0, drum: 0 };
        m.components.forEach((c: any) => {
          if (/toner/i.test(c.part)) monthly[ym].toner += c.quantity;
          else if (/drum/i.test(c.part)) monthly[ym].drum += c.quantity;
        });
      });

      return {
        assetId:     asset.id,
        assetTag:    asset.assetTag,
        model:       asset.model,
        location:    asset.location?.name ?? '—',
        isActive:    asset.isActive,
        latestPage:  (asset.pageCounters as any[])?.[0]?.total ?? null,
        tonerCount,
        drumCount,
        otherCount,
        totalJobs:   jobs.length,
        lastMaintDate: lastMaint?.completedAt ?? null,
        monthly,
      };
    });

    // totals
    const totals = {
      printers:  printers.length,
      toner:     printers.reduce((s, p) => s + p.tonerCount, 0),
      drum:      printers.reduce((s, p) => s + p.drumCount,  0),
      jobs:      printers.reduce((s, p) => s + p.totalJobs,  0),
    };

    return { printers, totals };
  }

  return {};
}

export async function mockPost(path: string, _body?: any): Promise<any> {
  await delay(200);
  // Login
  if (path === '/auth/login') {
    const fakeJwt = `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ id:1, exp: Date.now()/1000+86400 }))}.sig`;
    return { token: fakeJwt, user: MOCK_USER_ADMIN, permissions: MOCK_USER_ADMIN.permissions };
  }
  // Claim maintenance
  if (/^\/maintenance\/\d+\/claim$/.test(path)) return { ...MOCK_MAINTENANCE[0], status: 'IN_PROGRESS' };
  // Complete maintenance
  if (/^\/maintenance\/\d+\/complete$/.test(path)) return { status: 'COMPLETED' };
  // Review maintenance
  if (/^\/maintenance\/\d+\/review$/.test(path)) return { status: 'REVIEWED' };
  // Approve/reject asset
  if (/^\/assets\/\d+\/(approve|reject)$/.test(path)) return { needsReview: false };
  // Retire asset
  if (/^\/assets\/\d+\/retire$/.test(path)) return { isActive: false };
  // Import CSV
  if (path.startsWith('/import/')) return { file: 'mock.csv', parsed: { devices: [{},{},{}] }, unmatchedCount: 1 };
  // Create asset
  if (path === '/assets') return { id: 99, ...(_body||{}), createdAt: new Date().toISOString() };
  // Create maintenance
  if (path === '/maintenance') return { id: 99, ...(_body||{}), status: 'OPEN', createdAt: new Date().toISOString() };
  // Deactivate user
  if (/^\/users\/\d+\/deactivate$/.test(path)) return { isActive: false };
  // User permissions
  if (/^\/users\/\d+\/permissions$/.test(path)) return { ok: true };
  // Upload map image — store base64 directly in mock (no disk)
  if (/^\/locations\/\d+\/map-image$/.test(path)) {
    const id = Number(path.split('/')[2]);
    const loc = MOCK_LOCATIONS.find(l => l.id === id);
    if (!loc) throw new Error('Location not found');
    loc.mapImageUrl = _body?.imageData ?? null;
    return { ok: true, mapImageUrl: loc.mapImageUrl, location: loc };
  }
  // Create location
  if (path === '/locations') return { id: 99, name: _body?.name, createdAt: new Date().toISOString(), _count: { assets: 0 }, mapImageUrl: null };
  return { ok: true };
}

export async function mockPut(path: string, _body?: any): Promise<any> {
  await delay(200);
  return { ...(_body||{}), updatedAt: new Date().toISOString() };
}

export async function mockDel(path: string): Promise<any> {
  await delay(200);
  // Delete map image
  if (/^\/locations\/\d+\/map-image$/.test(path)) {
    const id = Number(path.split('/')[2]);
    const loc = MOCK_LOCATIONS.find(l => l.id === id);
    if (loc) loc.mapImageUrl = null;
    return { ok: true };
  }
  return { ok: true };
}
