/**
 * Seed script for dev/demo data
 * Run: node -r ts-node/register prisma/seed.ts
 * Or via: npx ts-node prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Users ────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('demo1234', 10);
  const techHash  = await bcrypt.hash('demo1234', 10);

  const admin = await db.user.upsert({
    where:  { email: 'admin@demo.com' },
    update: {},
    create: {
      name:         'Admin User',
      email:        'admin@demo.com',
      passwordHash: adminHash,
      role:         'ADMIN',
      isActive:     true,
    },
  });

  const tech1 = await db.user.upsert({
    where:  { email: 'tech@demo.com' },
    update: {},
    create: {
      name:         'สมชาย ช่างเทค',
      email:        'tech@demo.com',
      passwordHash: techHash,
      role:         'TECHNICIAN',
      primarySkill: 'Printer',
      isActive:     true,
    },
  });

  const tech2 = await db.user.upsert({
    where:  { email: 'tech2@demo.com' },
    update: {},
    create: {
      name:         'สมหญิง ซ่อมดี',
      email:        'tech2@demo.com',
      passwordHash: techHash,
      role:         'TECHNICIAN',
      primarySkill: 'Computer',
      isActive:     true,
    },
  });

  // Seed default permissions for technicians
  const techPerms = ['maintenance:claim', 'maintenance:complete', 'maintenance:edit'];
  for (const userId of [tech1.id, tech2.id]) {
    for (const permission of techPerms) {
      await db.userPermission.upsert({
        where:  { userId_permission: { userId, permission } },
        update: {},
        create: { userId, permission, grantedBy: admin.id },
      });
    }
  }

  console.log('✅ Users seeded');

  // ─── Locations ────────────────────────────────────────────────────────────
  const locOboj = await db.location.upsert({
    where:  { id: 1 },
    update: {},
    create: { name: 'อบจ.เชียงใหม่', building: 'อาคาร 1', floor: 'ชั้น 1' },
  });

  const locTaksin = await db.location.upsert({
    where:  { id: 2 },
    update: {},
    create: { name: 'ตากสิน', building: 'อาคารหลัก', floor: 'ชั้น 2' },
  });

  const locIT = await db.location.upsert({
    where:  { id: 3 },
    update: {},
    create: { name: 'ห้อง IT', building: 'อาคาร 2', floor: 'ชั้น 3' },
  });

  console.log('✅ Locations seeded');

  // ─── Assets ───────────────────────────────────────────────────────────────
  const assets = [
    {
      assetTag:     'PRN-001',
      serialNumber: 'BRO-SN-001',
      type:         'PRINTER',
      model:        'Brother MFC-L3750CDW',
      locationId:   locOboj.id,
      isActive:     true,
      needsReview:  false,
    },
    {
      assetTag:     'PRN-002',
      serialNumber: 'BRO-SN-002',
      type:         'PRINTER',
      model:        'Brother HL-L2370DN',
      locationId:   locOboj.id,
      isActive:     true,
      needsReview:  false,
    },
    {
      assetTag:     'PRN-003',
      serialNumber: 'BRO-SN-003',
      type:         'PRINTER',
      model:        'Brother MFC-J995DW',
      locationId:   locTaksin.id,
      isActive:     true,
      needsReview:  false,
    },
    {
      assetTag:     'PC-001',
      serialNumber: 'PC-SN-001',
      type:         'COMPUTER',
      model:        'Dell OptiPlex 7080',
      locationId:   locIT.id,
      isActive:     true,
      needsReview:  false,
      cpu:          'Intel Core i7-10700',
      ramGb:        16,
      storageType:  'SSD',
      storageGb:    512,
      os:           'Windows 11 Pro',
    },
    {
      assetTag:     'PC-002',
      serialNumber: 'PC-SN-002',
      type:         'COMPUTER',
      model:        'HP ProDesk 400 G7',
      locationId:   locIT.id,
      isActive:     true,
      needsReview:  false,
      cpu:          'Intel Core i5-10500',
      ramGb:        8,
      storageType:  'SSD',
      storageGb:    256,
      os:           'Windows 10 Pro',
    },
    {
      // Asset รอ review
      serialNumber: 'BRO-SN-NEW',
      type:         'PRINTER',
      model:        'Brother DCP-L2550DN',
      locationId:   locTaksin.id,
      isActive:     false,
      needsReview:  true,
    },
  ];

  const createdAssets: any[] = [];
  for (const a of assets) {
    const asset = await db.asset.upsert({
      where:  { serialNumber: a.serialNumber! },
      update: {},
      create: a as any,
    });
    createdAssets.push(asset);
  }

  // Page counters for printers
  for (const asset of createdAssets.filter((a) => a.type === 'PRINTER' && a.isActive)) {
    await db.pageCounterLog.create({
      data: {
        assetId:   asset.id,
        total:     Math.floor(Math.random() * 50000) + 5000,
        source:    'MANUAL',
        recordedAt: new Date(),
      },
    });
  }

  console.log('✅ Assets seeded');

  // ─── Maintenance Tickets ──────────────────────────────────────────────────
  const printer1 = createdAssets[0];
  const printer2 = createdAssets[1];
  const pc1      = createdAssets[3];

  // Ticket 1 — REVIEWED (เสร็จสมบูรณ์)
  const t1 = await db.maintenanceLog.create({
    data: {
      assetId:      printer1.id,
      dispatcherId: admin.id,
      technicianId: tech1.id,
      reviewedBy:   admin.id,
      issueDetails: 'หมึกหมด ต้องเปลี่ยน toner',
      symptom:      'พิมพ์ไม่ออก',
      repairDetails: 'เปลี่ยน toner ใหม่ TN-267BK',
      brand:        'Brother',
      totalPageAtRepair: 32500,
      status:       'REVIEWED',
      claimedAt:    new Date('2026-08-01T09:00:00Z'),
      completedAt:  new Date('2026-08-01T11:00:00Z'),
      reviewedAt:   new Date('2026-08-01T14:00:00Z'),
    },
  });
  await db.componentLog.create({
    data: { maintenanceId: t1.id, part: 'Toner TN-267BK', quantity: 1, pageAtReplacement: 32500 },
  });

  // Ticket 2 — REVIEWED
  const t2 = await db.maintenanceLog.create({
    data: {
      assetId:      printer2.id,
      dispatcherId: admin.id,
      technicianId: tech1.id,
      reviewedBy:   admin.id,
      issueDetails: 'Drum หมดอายุ',
      symptom:      'พิมพ์มีเส้นดำ',
      repairDetails: 'เปลี่ยน drum unit DR-267',
      brand:        'Brother',
      totalPageAtRepair: 15000,
      status:       'REVIEWED',
      claimedAt:    new Date('2026-08-10T09:00:00Z'),
      completedAt:  new Date('2026-08-10T13:00:00Z'),
      reviewedAt:   new Date('2026-08-11T09:00:00Z'),
    },
  });
  await db.componentLog.create({
    data: { maintenanceId: t2.id, part: 'Drum DR-267', quantity: 1, pageAtReplacement: 15000 },
  });

  // Ticket 3 — IN_PROGRESS
  await db.maintenanceLog.create({
    data: {
      assetId:      pc1.id,
      dispatcherId: admin.id,
      technicianId: tech2.id,
      issueDetails: 'เครื่องช้ามาก บูทนานกว่า 5 นาที',
      symptom:      'CPU 100%',
      status:       'IN_PROGRESS',
      claimedAt:    new Date(),
    },
  });

  // Ticket 4 — OPEN (รอรับงาน)
  await db.maintenanceLog.create({
    data: {
      assetId:      printer1.id,
      dispatcherId: admin.id,
      issueDetails: 'กระดาษติด ดึงไม่ออก',
      status:       'OPEN',
    },
  });

  // Ticket 5 — COMPLETED (รอ Review)
  const t5 = await db.maintenanceLog.create({
    data: {
      assetId:      printer2.id,
      dispatcherId: admin.id,
      technicianId: tech1.id,
      issueDetails: 'เปลี่ยน toner และทำความสะอาดเครื่อง',
      symptom:      'หมึกหมด + สกปรก',
      repairDetails: 'เปลี่ยน toner + ทำความสะอาด roller',
      brand:        'Brother',
      totalPageAtRepair: 18200,
      status:       'COMPLETED',
      claimedAt:    new Date(Date.now() - 2 * 3600000),
      completedAt:  new Date(),
    },
  });
  await db.componentLog.create({
    data: { maintenanceId: t5.id, part: 'Toner TN-267BK', quantity: 1, pageAtReplacement: 18200 },
  });

  console.log('✅ Maintenance tickets seeded');
  console.log('');
  console.log('🎉 Done! Demo accounts:');
  console.log('   Admin     : admin@demo.com  / demo1234');
  console.log('   Technician: tech@demo.com   / demo1234');
  console.log('   Technician: tech2@demo.com  / demo1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
