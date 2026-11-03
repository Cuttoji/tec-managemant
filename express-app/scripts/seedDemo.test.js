/**
 * Test for seedDemo.js
 *
 * Purpose:
 * - verify the demo seeding script creates the admin and technician users
 * - confirm default locations/assets/permissions are created
 * - confirm maintenance logs are populated for dashboard/report use
 */

const { spawnSync } = require('child_process');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const demoEmails = ['admin@demo.com', 'tech@demo.com', 'tech2@demo.com'];
const demoLocationNames = ['ชั้น 1 — สำนักงาน', 'ชั้น 2 — ห้องประชุม', 'ห้องเซิร์ฟเวอร์'];
const demoAssetTags = [
  'PR-001',
  'PR-002',
  'PR-003',
  'PR-004',
  'PC-001',
  'PC-002',
  'PC-003',
  'PR-LNR',
  'PR-OLD',
];
const demoSerialNumbers = [
  'U64893-A001',
  'U64893-A002',
  'U64893-A003',
  'U64893-A004',
  'DELL-B2001',
  'DELL-B2002',
  'HP-C3001',
  'LOANER-001',
  'OLD-9999',
];

function runSeedScript() {
  const env = { ...process.env };
  env.DATABASE_URL =
    env.DATABASE_URL || 'postgresql://appuser:apppassword@localhost:5432/repair_tracking_dev';

  return spawnSync(process.execPath, [path.join(__dirname, 'seedDemo.js')], {
    cwd: __dirname,
    env,
    encoding: 'utf8',
  });
}

async function cleanupSeededData() {
  const userRows = await prisma.user.findMany({
    where: { email: { in: demoEmails } },
    select: { id: true },
  });
  const userIds = userRows.map((u) => u.id);

  if (userIds.length > 0) {
    await prisma.userPermission.deleteMany({
      where: { userId: { in: userIds } },
    });
  }

  const assetRows = await prisma.asset.findMany({
    where: {
      OR: [
        { assetTag: { in: demoAssetTags } },
        { serialNumber: { in: demoSerialNumbers } },
      ],
    },
    select: { id: true },
  });
  const assetIds = assetRows.map((a) => a.id);

  if (assetIds.length > 0) {
    const maintenanceRows = await prisma.maintenanceLog.findMany({
      where: { assetId: { in: assetIds } },
      select: { id: true },
    });
    const maintenanceIds = maintenanceRows.map((m) => m.id);

    if (maintenanceIds.length > 0) {
      await prisma.componentLog.deleteMany({
        where: { maintenanceId: { in: maintenanceIds } },
      });
    }

    await prisma.maintenanceLog.deleteMany({
      where: { assetId: { in: assetIds } },
    });
    await prisma.pageCounterLog.deleteMany({
      where: { assetId: { in: assetIds } },
    });
    await prisma.asset.deleteMany({
      where: { id: { in: assetIds } },
    });
  }

  if (userIds.length > 0) {
    await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });
  }

  await prisma.location.deleteMany({
    where: { name: { in: demoLocationNames } },
  });
}

beforeAll(async () => {
  await cleanupSeededData();
}, 30000);

afterEach(async () => {
  await cleanupSeededData();
}, 30000);

afterAll(async () => {
  await cleanupSeededData();
  await prisma.$disconnect();
}, 30000);

describe('seedDemo.js', () => {
  test('creates admin and technician users with correct roles and password', async () => {
    const result = runSeedScript();

    expect(result.status).toBe(0, result.stderr || result.stdout);

    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@demo.com' },
    });
    const tech1 = await prisma.user.findUnique({
      where: { email: 'tech@demo.com' },
    });
    const tech2 = await prisma.user.findUnique({
      where: { email: 'tech2@demo.com' },
    });

    expect(adminUser).toBeTruthy();
    expect(tech1).toBeTruthy();
    expect(tech2).toBeTruthy();

    expect(adminUser.role).toBe('ADMIN');
    expect(tech1.role).toBe('TECHNICIAN');
    expect(tech2.role).toBe('TECHNICIAN');

    expect(adminUser.isActive).toBe(true);
    expect(tech1.isActive).toBe(true);
    expect(tech2.isActive).toBe(true);

    expect(adminUser.passwordHash).toBeTruthy();
    expect(bcrypt.compareSync('demo1234', adminUser.passwordHash)).toBe(true);
    expect(bcrypt.compareSync('demo1234', tech1.passwordHash)).toBe(true);
    expect(bcrypt.compareSync('demo1234', tech2.passwordHash)).toBe(true);
  });

  test('creates locations, assets, and default permissions for demo use', async () => {
    const result = runSeedScript();

    expect(result.status).toBe(0, result.stderr || result.stdout);

    const locations = await prisma.location.findMany();
    const assets = await prisma.asset.findMany();
    const tech1 = await prisma.user.findUnique({
      where: { email: 'tech@demo.com' },
    });

    const permissions = await prisma.userPermission.findMany({
      where: { userId: tech1.id },
      select: { permission: true },
    });

    expect(locations.length).toBeGreaterThanOrEqual(3);
    expect(assets.length).toBeGreaterThanOrEqual(12);

    expect(assets.some((asset) => asset.type === 'PRINTER')).toBe(true);
    expect(assets.some((asset) => asset.type === 'COMPUTER')).toBe(true);
    expect(assets.some((asset) => asset.needsReview === true)).toBe(true);

    const permissionSet = permissions.map((p) => p.permission);
    expect(permissionSet).toContain('maintenance:claim');
    expect(permissionSet).toContain('maintenance:complete');
    expect(permissionSet).toContain('maintenance:edit');
    expect(permissionSet).toContain('asset:edit');
  });

  test('creates maintenance logs, component logs, and page counters for dashboard data', async () => {
    const result = runSeedScript();

    expect(result.status).toBe(0, result.stderr || result.stdout);

    const maintenanceLogs = await prisma.maintenanceLog.findMany();
    const componentLogs = await prisma.componentLog.findMany();
    const pageCounterLogs = await prisma.pageCounterLog.findMany();

    expect(maintenanceLogs.length).toBeGreaterThanOrEqual(6);
    expect(maintenanceLogs.some((entry) => entry.status === 'OPEN')).toBe(true);
    expect(maintenanceLogs.some((entry) => entry.status === 'IN_PROGRESS')).toBe(true);
    expect(maintenanceLogs.some((entry) => entry.status === 'COMPLETED')).toBe(true);
    expect(maintenanceLogs.some((entry) => entry.status === 'REVIEWED')).toBe(true);

    expect(componentLogs.length).toBeGreaterThanOrEqual(1);
    expect(pageCounterLogs.length).toBeGreaterThanOrEqual(3);
  });
});
