/**
 * Demo Seed Script
 * รัน: node scripts/seedDemo.js
 *
 * สร้างข้อมูลตัวอย่างสำหรับ demo:
 *  - 2 users (admin + technician)
 *  - 3 locations
 *  - 12 assets (printer + computer)
 *  - maintenance logs ทุก status
 *  - component logs + page counter logs
 */

// Load DATABASE_URL directly since dotenv may not be installed globally
process.env.DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://appuser:apppassword@localhost:5432/repair_tracking_dev';
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const PASS_HASH = bcrypt.hashSync('demo1234', 10);

async function main() {
  console.log('🌱 Starting demo seed...\n');

  /* ── 1. Users ───────────────────────────────── */
  console.log('👤 Creating users...');

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@demo.com' },
    update: {},
    create: {
      name:         'Admin Demo',
      email:        'admin@demo.com',
      passwordHash: PASS_HASH,
      role:         'ADMIN',
      isActive:     true,
    },
  });

  const tech1 = await prisma.user.upsert({
    where:  { email: 'tech@demo.com' },
    update: {},
    create: {
      name:         'สมชาย ช่างซ่อม',
      email:        'tech@demo.com',
      passwordHash: PASS_HASH,
      role:         'TECHNICIAN',
      primarySkill: 'Printer',
      isActive:     true,
    },
  });

  const tech2 = await prisma.user.upsert({
    where:  { email: 'tech2@demo.com' },
    update: {},
    create: {
      name:         'สมหญิง ช่างพิมพ์',
      email:        'tech2@demo.com',
      passwordHash: PASS_HASH,
      role:         'TECHNICIAN',
      primarySkill: 'Computer',
      isActive:     true,
    },
  });

  // Seed default permissions for technicians
  const DEFAULT_PERMS = ['maintenance:claim', 'maintenance:complete', 'maintenance:edit'];
  for (const user of [tech1, tech2]) {
    await prisma.userPermission.createMany({
      data: DEFAULT_PERMS.map(permission => ({
        userId:    user.id,
        permission,
        grantedBy: admin.id,
      })),
      skipDuplicates: true,
    });
  }

  // Grant asset:edit to tech1
  await prisma.userPermission.upsert({
    where:  { userId_permission: { userId: tech1.id, permission: 'asset:edit' } },
    update: {},
    create: { userId: tech1.id, permission: 'asset:edit', grantedBy: admin.id },
  });

  console.log(`  ✓ admin@demo.com  (ADMIN)`);
  console.log(`  ✓ tech@demo.com   (TECHNICIAN + asset:edit)`);
  console.log(`  ✓ tech2@demo.com  (TECHNICIAN)\n`);

  /* ── 2. Locations ───────────────────────────── */
  console.log('📍 Creating locations...');

  const locNames = ['ชั้น 1 — สำนักงาน', 'ชั้น 2 — ห้องประชุม', 'ห้องเซิร์ฟเวอร์'];
  const locs = [];
  for (const name of locNames) {
    const loc = await prisma.location.upsert({
      where:  { id: (await prisma.location.findFirst({ where: { name } }))?.id ?? 0 },
      update: {},
      create: { name },
    }).catch(() => prisma.location.create({ data: { name } }));
    locs.push(loc);
    console.log(`  ✓ ${name}`);
  }
  console.log();

  /* ── 3. Assets ──────────────────────────────── */
  console.log('🖥️  Creating assets...');

  const assetDefs = [
    // Printers
    { assetTag: 'PR-001', serialNumber: 'U64893-A001', type: 'PRINTER', model: 'Brother MFC-L3750CDW', locationId: locs[0].id, needsReview: false },
    { assetTag: 'PR-002', serialNumber: 'U64893-A002', type: 'PRINTER', model: 'Brother MFC-L8900CDW', locationId: locs[1].id, needsReview: false },
    { assetTag: 'PR-003', serialNumber: 'U64893-A003', type: 'PRINTER', model: 'Brother HL-L9310CDW',  locationId: locs[0].id, needsReview: false },
    { assetTag: 'PR-004', serialNumber: 'U64893-A004', type: 'PRINTER', model: 'Brother DCP-L2550DW',  locationId: locs[2].id, needsReview: false },
    // Computers
    { assetTag: 'PC-001', serialNumber: 'DELL-B2001',  type: 'COMPUTER', model: 'Dell OptiPlex 7090',  locationId: locs[0].id, cpu: 'Intel Core i7-10700', ramGb: 16, storageType: 'SSD', storageGb: 512, needsReview: false },
    { assetTag: 'PC-002', serialNumber: 'DELL-B2002',  type: 'COMPUTER', model: 'Dell OptiPlex 5090',  locationId: locs[1].id, cpu: 'Intel Core i5-10500', ramGb: 8,  storageType: 'SSD', storageGb: 256, needsReview: false },
    { assetTag: 'PC-003', serialNumber: 'HP-C3001',    type: 'COMPUTER', model: 'HP EliteDesk 800 G6', locationId: locs[0].id, cpu: 'Intel Core i7-10700', ramGb: 16, storageType: 'SSD', storageGb: 512, needsReview: false },
    // Loaner printer (ใช้เป็น loaner ใน demo)
    { assetTag: 'PR-LNR', serialNumber: 'LOANER-001',  type: 'PRINTER', model: 'Brother HL-L2366DW (สำรอง)', locationId: locs[2].id, needsReview: false },
    // Needs review (from import)
    { assetTag: null, serialNumber: 'IMPORT-X001', type: 'PRINTER', model: 'Brother MFC-L2710DW', locationId: locs[0].id, needsReview: true },
    { assetTag: null, serialNumber: 'IMPORT-X002', type: 'PRINTER', model: 'Brother MFC-J4340DW', locationId: locs[1].id, needsReview: true },
    { assetTag: null, serialNumber: 'IMPORT-X003', type: 'COMPUTER', model: 'Lenovo ThinkCentre M720', locationId: null, needsReview: true },
    // Retired
    { assetTag: 'PR-OLD', serialNumber: 'OLD-9999', type: 'PRINTER', model: 'Brother MFC-7460DN (เก่า)', locationId: null, isActive: false, retiredAt: new Date('2026-01-15'), needsReview: false },
  ];

  const assets = [];
  for (const def of assetDefs) {
    const existing = def.serialNumber
      ? await prisma.asset.findUnique({ where: { serialNumber: def.serialNumber } })
      : null;
    if (existing) { assets.push(existing); continue; }

    const a = await prisma.asset.create({ data: def });
    assets.push(a);
  }

  // Page counter logs for printers
  const printers = assets.filter(a => a.type === 'PRINTER' && a.isActive !== false);
  for (const p of printers) {
    const existingCount = await prisma.pageCounterLog.count({ where: { assetId: p.id } });
    if (existingCount === 0) {
      const base = Math.floor(Math.random() * 80000) + 20000;
      await prisma.pageCounterLog.createMany({
        data: [
          { assetId: p.id, total: base,        recordedAt: new Date('2026-06-01') },
          { assetId: p.id, total: base + 1240,  recordedAt: new Date('2026-07-01') },
          { assetId: p.id, total: base + 2855,  recordedAt: new Date('2026-08-01') },
        ],
      });
    }
  }

  console.log(`  ✓ ${assets.length} assets created\n`);

  /* ── 4. Maintenance Logs ─────────────────────── */
  console.log('🔧 Creating maintenance logs...');

  const [pr1, pr2, pr3, pr4, pc1, pc2] = assets;
  const loanerAsset = assets.find(a => a.assetTag === 'PR-LNR');

  const existingMaint = await prisma.maintenanceLog.count();
  if (existingMaint > 0) {
    console.log('  ↩ Maintenance logs already exist, skipping\n');
  } else {
    // 1. REVIEWED — ซ่อมเสร็จสมบูรณ์
    const m1 = await prisma.maintenanceLog.create({
      data: {
        assetId:          pr1.id,
        dispatcherId:     admin.id,
        technicianId:     tech1.id,
        issueDetails:     'กระดาษติดบ่อย โดยเฉพาะ Tray 2',
        symptom:          'กระดาษติดทุก 20-30 แผ่น มีเสียงผิดปกติจาก Roller',
        brand:            'Brother MFC-L3750CDW',
        totalPageAtRepair: 52340,
        partReplacedAt:   new Date('2026-07-20T10:30:00'),
        repairDetails:    'เปลี่ยน Paper Feed Roller ชุด Tray 2 และทำความสะอาด Pick-up Roller พร้อม Separator Pad',
        usedLoaner:       true,
        loanerAssetId:    loanerAsset && loanerAsset.id,
        loanerPageStart:  12000,
        loanerPageEnd:    13450,
        status:           'REVIEWED',
        claimedAt:        new Date('2026-07-18T09:00:00'),
        completedAt:      new Date('2026-07-20T14:00:00'),
        reviewedBy:       admin.id,
        reviewedAt:       new Date('2026-07-21T09:00:00'),
        reviewNotes:      'ซ่อมผ่าน เครื่องทำงานปกติแล้ว',
      },
    });
    await prisma.componentLog.createMany({
      data: [
        { maintenanceId: m1.id, part: 'Paper Feed Roller Set (LY3282001)', quantity: 1 },
        { maintenanceId: m1.id, part: 'Separator Pad (LY2779001)',          quantity: 1 },
        { maintenanceId: m1.id, part: 'น้ำยาทำความสะอาด Roller',           quantity: 1 },
      ],
    });

    // 2. COMPLETED — รอ Admin review
    const m2 = await prisma.maintenanceLog.create({
      data: {
        assetId:          pr2.id,
        dispatcherId:     admin.id,
        technicianId:     tech2.id,
        issueDetails:     'พิมพ์สีไม่ออก Cyan และ Magenta',
        symptom:          'พิมพ์เอกสารสีออกมาเป็นสีเหลือง ไม่มี Cyan/Magenta',
        brand:            'Brother MFC-L8900CDW',
        totalPageAtRepair: 38910,
        partReplacedAt:   new Date('2026-07-28T14:00:00'),
        repairDetails:    'เปลี่ยน Toner Cartridge Cyan (TN-910C) และ Magenta (TN-910M) พร้อม Reset Page Count',
        usedLoaner:       false,
        status:           'COMPLETED',
        claimedAt:        new Date('2026-07-27T08:30:00'),
        completedAt:      new Date('2026-07-28T16:00:00'),
      },
    });
    await prisma.componentLog.createMany({
      data: [
        { maintenanceId: m2.id, part: 'Toner TN-910C (Cyan)',    quantity: 1 },
        { maintenanceId: m2.id, part: 'Toner TN-910M (Magenta)', quantity: 1 },
      ],
    });

    // 3. IN_PROGRESS — ช่างรับงานแล้ว
    await prisma.maintenanceLog.create({
      data: {
        assetId:      pr3.id,
        dispatcherId: admin.id,
        technicianId: tech1.id,
        issueDetails: 'Drum Unit หมดอายุ แจ้งเตือน Replace Drum',
        status:       'IN_PROGRESS',
        claimedAt:    new Date('2026-07-31T08:00:00'),
      },
    });

    // 4. OPEN — ยังไม่มีช่างรับ
    await prisma.maintenanceLog.create({
      data: {
        assetId:      pc1.id,
        dispatcherId: admin.id,
        issueDetails: 'เครื่องบูทช้ามาก ใช้เวลามากกว่า 10 นาที',
        status:       'OPEN',
      },
    });

    // 5. OPEN — อีกงาน
    await prisma.maintenanceLog.create({
      data: {
        assetId:      pr4.id,
        dispatcherId: admin.id,
        issueDetails: 'Fuser Unit เสีย กระดาษออกมาหมึกเลอะ ติดมือ',
        status:       'OPEN',
      },
    });

    // 6. REVIEWED — reject แล้ว reopen
    const m6 = await prisma.maintenanceLog.create({
      data: {
        assetId:      pc2.id,
        dispatcherId: admin.id,
        technicianId: tech2.id,
        issueDetails: 'เปิดเครื่องไม่ติด ไฟ Power กะพริบ 3 ครั้ง',
        symptom:      'กด Power แล้วไฟกะพริบ 3 ครั้งแล้วดับ ไม่บูท',
        brand:        'Dell OptiPlex 5090',
        repairDetails: 'เปลี่ยน RAM แต่ยังไม่หาย น่าจะเป็น Motherboard',
        status:       'OPEN',
        claimedAt:    null,
        completedAt:  null,
        reviewedBy:   admin.id,
        reviewedAt:   new Date('2026-07-25T10:00:00'),
        reviewNotes:  'ซ่อมไม่ผ่าน RAM ไม่ใช่สาเหตุ ให้ตรวจสอบ Motherboard เพิ่มเติม',
      },
    });
    await prisma.componentLog.create({
      data: { maintenanceId: m6.id, part: 'DDR4 8GB RAM', quantity: 1 },
    });

    console.log('  ✓ 6 maintenance logs created (OPEN×2, IN_PROGRESS×1, COMPLETED×1, REVIEWED×2)\n');
  }

  /* ── Summary ─────────────────────────────────── */
  const counts = {
    users:    await prisma.user.count(),
    assets:   await prisma.asset.count(),
    locs:     await prisma.location.count(),
    maint:    await prisma.maintenanceLog.count(),
    comps:    await prisma.componentLog.count(),
    pages:    await prisma.pageCounterLog.count(),
    perms:    await prisma.userPermission.count(),
  };

  console.log('─'.repeat(40));
  console.log('✅ Seed complete!\n');
  console.log('📊 Database summary:');
  Object.entries(counts).forEach(([k, v]) => console.log(`   ${k.padEnd(10)} ${v}`));
  console.log('\n🔑 Login credentials:');
  console.log('   Admin      admin@demo.com   / demo1234');
  console.log('   Tech 1     tech@demo.com    / demo1234  (+ asset:edit)');
  console.log('   Tech 2     tech2@demo.com   / demo1234');
  console.log('─'.repeat(40));
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
