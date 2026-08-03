// Mock data for UI preview — used when NEXT_PUBLIC_MOCK=true

export const MOCK_USER_ADMIN = {
  id: 1, name: 'Admin User', email: 'admin@demo.com', role: 'ADMIN' as const,
  permissions: ['maintenance:claim','maintenance:complete','maintenance:edit','asset:edit','location:manage'],
};

export const MOCK_LOCATIONS = [
  { id: 1, name: 'อบจ. — ชั้น 1',      createdAt: '2026-01-10T00:00:00Z', _count: { assets: 3 }, mapImageUrl: null },
  { id: 2, name: 'อบจ. — ชั้น 2',      createdAt: '2026-01-10T00:00:00Z', _count: { assets: 2 }, mapImageUrl: null },
  { id: 3, name: 'รร.ตากสิน — ชั้น 1', createdAt: '2026-01-10T00:00:00Z', _count: { assets: 3 }, mapImageUrl: null },
  { id: 4, name: 'รร.ตากสิน — ชั้น 2', createdAt: '2026-01-10T00:00:00Z', _count: { assets: 2 }, mapImageUrl: null },
];

export const MOCK_ASSETS = [
  { id: 1,  assetTag: 'PR-001', serialNumber: 'BRO-L8360-001',    type: 'PRINTER',  model: 'Brother HL-L8360DW',      location: MOCK_LOCATIONS[0], locationId: 1, isActive: true,  needsReview: false, createdAt: '2025-06-01T00:00:00Z', pageCounters: [{ id:1, total: 38420,  recordedAt: '2026-07-01T00:00:00Z' }] },
  { id: 2,  assetTag: 'PR-002', serialNumber: 'BRO-L8360-002',    type: 'PRINTER',  model: 'Brother HL-L8360DW',      location: MOCK_LOCATIONS[1], locationId: 2, isActive: true,  needsReview: false, createdAt: '2025-06-01T00:00:00Z', pageCounters: [{ id:2, total: 29100,  recordedAt: '2026-07-01T00:00:00Z' }] },
  { id: 3,  assetTag: 'PR-003', serialNumber: 'BRO-L5210-001',    type: 'PRINTER',  model: 'Brother HL-L5210DN',      location: MOCK_LOCATIONS[0], locationId: 1, isActive: true,  needsReview: false, createdAt: '2025-08-01T00:00:00Z', pageCounters: [{ id:3, total: 51200,  recordedAt: '2026-07-10T00:00:00Z' }] },
  { id: 4,  assetTag: 'PR-004', serialNumber: 'BRO-L5210-002',    type: 'PRINTER',  model: 'Brother HL-L5210DN',      location: MOCK_LOCATIONS[1], locationId: 2, isActive: true,  needsReview: false, createdAt: '2025-08-01T00:00:00Z', pageCounters: [{ id:4, total: 44800,  recordedAt: '2026-07-10T00:00:00Z' }] },
  { id: 5,  assetTag: 'PR-005', serialNumber: 'FUJ-AP7P5021-001', type: 'PRINTER',  model: 'ApeosPort-VII P5021',     location: MOCK_LOCATIONS[2], locationId: 3, isActive: true,  needsReview: false, createdAt: '2025-04-01T00:00:00Z', pageCounters: [{ id:5, total: 112400, recordedAt: '2026-07-15T00:00:00Z' }] },
  { id: 6,  assetTag: 'PR-006', serialNumber: 'FUJ-AP7P5021-002', type: 'PRINTER',  model: 'ApeosPort-VII P5021',     location: MOCK_LOCATIONS[3], locationId: 4, isActive: true,  needsReview: false, createdAt: '2025-04-01T00:00:00Z', pageCounters: [{ id:6, total: 98700,  recordedAt: '2026-07-15T00:00:00Z' }] },
  { id: 7,  assetTag: 'PC-001', serialNumber: 'C11223-A0031',     type: 'COMPUTER', model: 'Dell OptiPlex 7090',      location: MOCK_LOCATIONS[0], locationId: 1, isActive: true,  needsReview: false, createdAt: '2026-02-01T00:00:00Z', pageCounters: [], cpu: 'Intel i7-10700', ramGb: 16, storageType: 'SSD', storageGb: 512 },
  { id: 8,  assetTag: 'PC-002', serialNumber: 'C11223-A0032',     type: 'COMPUTER', model: 'Dell OptiPlex 7090',      location: MOCK_LOCATIONS[1], locationId: 2, isActive: true,  needsReview: false, createdAt: '2026-02-01T00:00:00Z', pageCounters: [], cpu: 'Intel i5-10500', ramGb: 8,  storageType: 'SSD', storageGb: 256 },
  { id: 9,  assetTag: 'SC-001', serialNumber: 'S22001-K0012',     type: 'SCANNER',  model: 'Fujitsu ScanSnap iX1600', location: MOCK_LOCATIONS[2], locationId: 3, isActive: true,  needsReview: false, createdAt: '2026-03-20T00:00:00Z', pageCounters: [] },
  { id: 10, assetTag: 'PC-003', serialNumber: 'HP-C3001',         type: 'COMPUTER', model: 'HP EliteDesk 800 G6',     location: MOCK_LOCATIONS[2], locationId: 3, isActive: true,  needsReview: true,  createdAt: '2026-05-01T00:00:00Z', pageCounters: [] },
];

const DISPATCHER = { id: 1, name: 'Admin User',  email: 'admin@demo.com', role: 'ADMIN' };
const TECH       = { id: 2, name: 'Somchai Tech', email: 'tech@demo.com',  role: 'TECHNICIAN' };
const TECH2      = { id: 3, name: 'Malee Fix',    email: 'malee@demo.com', role: 'TECHNICIAN' };

// helpers for concise rows
const r = (id: number, assetIdx: number, issue: string, status: string, created: string, completed: string|null, page: number|null, components: any[], tech: any = TECH) => ({
  id, assetId: MOCK_ASSETS[assetIdx].id, asset: MOCK_ASSETS[assetIdx],
  dispatcherId: 1, dispatcher: DISPATCHER, technicianId: tech.id, technician: tech,
  issueDetails: issue, status,
  claimedAt: created, completedAt: completed,
  createdAt: created, updatedAt: completed ?? created,
  symptom: null, repairDetails: null, brand: null,
  totalPageAtRepair: page, usedLoaner: false,
  loanerAssetId: null, loanerAsset: null, loanerPageStart: null, loanerPageEnd: null,
  reviewNotes: null, components,
});

export const MOCK_MAINTENANCE = [
  // ── HL-L8360DW (PR-001, idx 0) ── Toner ทุก ~2 เดือน
  r( 1, 0, 'เปลี่ยน Toner ดำหมด',      'REVIEWED', '2025-09-05T08:00:00Z', '2025-09-05T09:30:00Z', 8200,  [{ id:1,  part: 'Toner TN-421BK', quantity: 1 }]),
  r( 2, 0, 'เปลี่ยน Drum unit',        'REVIEWED', '2025-10-12T08:00:00Z', '2025-10-12T10:00:00Z', 14500, [{ id:2,  part: 'Drum DR-421',    quantity: 1 }]),
  r( 3, 0, 'เปลี่ยน Toner ดำหมด',      'REVIEWED', '2025-11-20T08:00:00Z', '2025-11-20T09:30:00Z', 20100, [{ id:3,  part: 'Toner TN-421BK', quantity: 1 }]),
  r( 4, 0, 'เปลี่ยน Toner ดำหมด',      'REVIEWED', '2026-01-15T08:00:00Z', '2026-01-15T09:30:00Z', 26800, [{ id:4,  part: 'Toner TN-421BK', quantity: 1 }]),
  r( 5, 0, 'เปลี่ยน Toner ดำหมด',      'REVIEWED', '2026-03-10T08:00:00Z', '2026-03-10T09:30:00Z', 32400, [{ id:5,  part: 'Toner TN-421BK', quantity: 1 }]),
  r( 6, 0, 'เปลี่ยน Drum unit',        'REVIEWED', '2026-05-20T08:00:00Z', '2026-05-20T10:00:00Z', 37200, [{ id:6,  part: 'Drum DR-421',    quantity: 1 }]),
  r( 7, 0, 'กระดาษติด',               'IN_PROGRESS','2026-07-20T08:00:00Z',null,                   38420, []),

  // ── HL-L8360DW (PR-002, idx 1) ──
  r( 8, 1, 'เปลี่ยน Toner ดำหมด',      'REVIEWED', '2025-10-05T08:00:00Z', '2025-10-05T09:30:00Z', 6100,  [{ id:7,  part: 'Toner TN-421BK', quantity: 1 }]),
  r( 9, 1, 'เปลี่ยน Toner ดำหมด',      'REVIEWED', '2025-12-18T08:00:00Z', '2025-12-18T09:30:00Z', 14200, [{ id:8,  part: 'Toner TN-421BK', quantity: 1 }]),
  r(10, 1, 'เปลี่ยน Drum unit',        'REVIEWED', '2026-02-10T08:00:00Z', '2026-02-10T10:00:00Z', 19800, [{ id:9,  part: 'Drum DR-421',    quantity: 1 }]),
  r(11, 1, 'เปลี่ยน Toner ดำหมด',      'REVIEWED', '2026-04-22T08:00:00Z', '2026-04-22T09:30:00Z', 25600, [{ id:10, part: 'Toner TN-421BK', quantity: 1 }]),
  r(12, 1, 'เปลี่ยน Toner ดำหมด',      'REVIEWED', '2026-06-30T08:00:00Z', '2026-06-30T09:30:00Z', 29100, [{ id:11, part: 'Toner TN-421BK', quantity: 1 }]),

  // ── HL-L5210DN (PR-003, idx 2) ── ใช้งานหนัก Toner ทุก 1.5 เดือน
  r(13, 2, 'เปลี่ยน Toner ดำหมด',      'REVIEWED', '2025-09-10T08:00:00Z', '2025-09-10T09:30:00Z', 9200,  [{ id:12, part: 'Toner TN-3480',  quantity: 1 }]),
  r(14, 2, 'เปลี่ยน Toner ดำหมด',      'REVIEWED', '2025-10-25T08:00:00Z', '2025-10-25T09:30:00Z', 16800, [{ id:13, part: 'Toner TN-3480',  quantity: 1 }]),
  r(15, 2, 'เปลี่ยน Drum unit',        'REVIEWED', '2025-11-15T08:00:00Z', '2025-11-15T10:00:00Z', 22400, [{ id:14, part: 'Drum DR-3400',   quantity: 1 }]),
  r(16, 2, 'เปลี่ยน Toner ดำหมด',      'REVIEWED', '2025-12-20T08:00:00Z', '2025-12-20T09:30:00Z', 30100, [{ id:15, part: 'Toner TN-3480',  quantity: 1 }]),
  r(17, 2, 'เปลี่ยน Toner ดำหมด',      'REVIEWED', '2026-02-05T08:00:00Z', '2026-02-05T09:30:00Z', 37400, [{ id:16, part: 'Toner TN-3480',  quantity: 1 }]),
  r(18, 2, 'เปลี่ยน Toner ดำหมด',      'REVIEWED', '2026-03-20T08:00:00Z', '2026-03-20T09:30:00Z', 43500, [{ id:17, part: 'Toner TN-3480',  quantity: 1 }]),
  r(19, 2, 'เปลี่ยน Drum unit',        'REVIEWED', '2026-04-15T08:00:00Z', '2026-04-15T10:00:00Z', 46800, [{ id:18, part: 'Drum DR-3400',   quantity: 1 }]),
  r(20, 2, 'เปลี่ยน Toner ดำหมด',      'REVIEWED', '2026-05-30T08:00:00Z', '2026-05-30T09:30:00Z', 49200, [{ id:19, part: 'Toner TN-3480',  quantity: 1 }]),
  r(21, 2, 'เปลี่ยน Toner ดำหมด',      'COMPLETED','2026-07-10T08:00:00Z', '2026-07-10T09:30:00Z', 51200, [{ id:20, part: 'Toner TN-3480',  quantity: 1 }]),

  // ── HL-L5210DN (PR-004, idx 3) ──
  r(22, 3, 'เปลี่ยน Toner ดำหมด',      'REVIEWED', '2025-10-10T08:00:00Z', '2025-10-10T09:30:00Z', 8400,  [{ id:21, part: 'Toner TN-3480',  quantity: 1 }]),
  r(23, 3, 'เปลี่ยน Drum unit',        'REVIEWED', '2025-12-05T08:00:00Z', '2025-12-05T10:00:00Z', 18200, [{ id:22, part: 'Drum DR-3400',   quantity: 1 }]),
  r(24, 3, 'เปลี่ยน Toner ดำหมด',      'REVIEWED', '2026-01-20T08:00:00Z', '2026-01-20T09:30:00Z', 26500, [{ id:23, part: 'Toner TN-3480',  quantity: 1 }]),
  r(25, 3, 'เปลี่ยน Toner ดำหมด',      'REVIEWED', '2026-03-15T08:00:00Z', '2026-03-15T09:30:00Z', 34100, [{ id:24, part: 'Toner TN-3480',  quantity: 1 }]),
  r(26, 3, 'เปลี่ยน Toner ดำหมด',      'REVIEWED', '2026-05-10T08:00:00Z', '2026-05-10T09:30:00Z', 40800, [{ id:25, part: 'Toner TN-3480',  quantity: 1 }]),
  r(27, 3, 'เปลี่ยน Drum unit',        'REVIEWED', '2026-06-20T08:00:00Z', '2026-06-20T10:00:00Z', 44000, [{ id:26, part: 'Drum DR-3400',   quantity: 1 }]),

  // ── ApeosPort-VII P5021 (PR-005, idx 4) ── volume สูง Toner บ่อย
  r(28, 4, 'เปลี่ยน Toner ดำ',         'REVIEWED', '2025-09-01T08:00:00Z', '2025-09-01T09:00:00Z', 18200, [{ id:27, part: 'Toner CT203502', quantity: 2 }]),
  r(29, 4, 'เปลี่ยน Drum unit',        'REVIEWED', '2025-10-01T08:00:00Z', '2025-10-01T10:30:00Z', 28400, [{ id:28, part: 'Drum CT351194', quantity: 1 }]),
  r(30, 4, 'เปลี่ยน Toner ดำ',         'REVIEWED', '2025-11-01T08:00:00Z', '2025-11-01T09:00:00Z', 38800, [{ id:29, part: 'Toner CT203502', quantity: 2 }]),
  r(31, 4, 'เปลี่ยน Toner ดำ',         'REVIEWED', '2025-12-05T08:00:00Z', '2025-12-05T09:00:00Z', 52000, [{ id:30, part: 'Toner CT203502', quantity: 2 }]),
  r(32, 4, 'เปลี่ยน Toner ดำ',         'REVIEWED', '2026-01-10T08:00:00Z', '2026-01-10T09:00:00Z', 65400, [{ id:31, part: 'Toner CT203502', quantity: 2 }]),
  r(33, 4, 'เปลี่ยน Drum unit',        'REVIEWED', '2026-02-05T08:00:00Z', '2026-02-05T10:30:00Z', 74200, [{ id:32, part: 'Drum CT351194', quantity: 1 }]),
  r(34, 4, 'เปลี่ยน Toner ดำ',         'REVIEWED', '2026-03-05T08:00:00Z', '2026-03-05T09:00:00Z', 86100, [{ id:33, part: 'Toner CT203502', quantity: 2 }]),
  r(35, 4, 'เปลี่ยน Toner ดำ',         'REVIEWED', '2026-04-05T08:00:00Z', '2026-04-05T09:00:00Z', 97800, [{ id:34, part: 'Toner CT203502', quantity: 2 }]),
  r(36, 4, 'เปลี่ยน Toner ดำ',         'REVIEWED', '2026-05-08T08:00:00Z', '2026-05-08T09:00:00Z',108200, [{ id:35, part: 'Toner CT203502', quantity: 2 }]),
  r(37, 4, 'เปลี่ยน Drum unit',        'REVIEWED', '2026-06-01T08:00:00Z', '2026-06-01T10:30:00Z',115600, [{ id:36, part: 'Drum CT351194', quantity: 1 }]),

  // ── ApeosPort-VII P5021 (PR-006, idx 5) ──
  r(38, 5, 'เปลี่ยน Toner ดำ',         'REVIEWED', '2025-09-15T08:00:00Z', '2025-09-15T09:00:00Z', 14200, [{ id:37, part: 'Toner CT203502', quantity: 2 }]),
  r(39, 5, 'เปลี่ยน Drum unit',        'REVIEWED', '2025-11-10T08:00:00Z', '2025-11-10T10:30:00Z', 28800, [{ id:38, part: 'Drum CT351194', quantity: 1 }]),
  r(40, 5, 'เปลี่ยน Toner ดำ',         'REVIEWED', '2025-12-20T08:00:00Z', '2025-12-20T09:00:00Z', 41600, [{ id:39, part: 'Toner CT203502', quantity: 2 }]),
  r(41, 5, 'เปลี่ยน Toner ดำ',         'REVIEWED', '2026-02-15T08:00:00Z', '2026-02-15T09:00:00Z', 58200, [{ id:40, part: 'Toner CT203502', quantity: 2 }]),
  r(42, 5, 'เปลี่ยน Toner ดำ',         'REVIEWED', '2026-04-10T08:00:00Z', '2026-04-10T09:00:00Z', 76400, [{ id:41, part: 'Toner CT203502', quantity: 2 }]),
  r(43, 5, 'เปลี่ยน Drum unit',        'REVIEWED', '2026-05-20T08:00:00Z', '2026-05-20T10:30:00Z', 86800, [{ id:42, part: 'Drum CT351194', quantity: 1 }]),
  r(44, 5, 'เปลี่ยน Toner ดำ',         'REVIEWED', '2026-07-05T08:00:00Z', '2026-07-05T09:00:00Z', 98700, [{ id:43, part: 'Toner CT203502', quantity: 2 }]),
];

export const MOCK_USERS = [
  { id: 1, name: 'Admin User',   email: 'admin@demo.com',  role: 'ADMIN',      primarySkill: null,          isActive: true, permissions: [] },
  { id: 2, name: 'Somchai Tech', email: 'tech@demo.com',   role: 'TECHNICIAN', primarySkill: 'เครื่องพิมพ์',  isActive: true, permissions: ['asset:edit'] },
  { id: 3, name: 'Malee Fix',    email: 'malee@demo.com',  role: 'TECHNICIAN', primarySkill: 'คอมพิวเตอร์',  isActive: true, permissions: [] },
  { id: 4, name: 'Prasit IT',    email: 'prasit@demo.com', role: 'TECHNICIAN', primarySkill: 'เครือข่าย',   isActive: false, permissions: [] },
];

export const MOCK_IMPORT_LOGS = [
  { id: 1, filename: 'bradmin_export_2026-07-01.csv', filePath: '/imports/bradmin_export_2026-07-01.csv', unmatchedCount: 2, createdAt: '2026-07-01T10:00:00Z', createdByUser: MOCK_USERS[0] },
  { id: 2, filename: 'bradmin_export_2026-07-15.csv', filePath: '/imports/bradmin_export_2026-07-15.csv', unmatchedCount: 0, createdAt: '2026-07-15T14:30:00Z', createdByUser: MOCK_USERS[0] },
  { id: 3, filename: 'bradmin_export_2026-08-01.csv', filePath: '/imports/bradmin_export_2026-08-01.csv', unmatchedCount: 5, createdAt: '2026-08-01T09:00:00Z', createdByUser: MOCK_USERS[0] },
];
