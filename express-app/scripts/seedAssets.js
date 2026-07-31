const prisma = require('../src/db');

async function seed() {
  try {
    const assets = [
      { type: 'Printer', assetTag: 'PR-100', serialNumber: 'SN100', needsReview: true, locationId: null },
      { type: 'Router', assetTag: 'RT-200', serialNumber: 'SN200', needsReview: true },
      { type: 'Switch', assetTag: 'SW-300', serialNumber: 'SN300', needsReview: true },
      { type: 'Laptop', assetTag: 'LT-400', serialNumber: 'SN400', needsReview: false, isActive: true },
      { type: 'Printer', assetTag: 'PR-500', serialNumber: 'SN500', needsReview: true },
    ];

    for (const a of assets) {
      // safe create: avoid duplicates by assetTag
      const existing = a.assetTag ? await prisma.asset.findUnique({ where: { assetTag: a.assetTag } }) : null;
      if (existing) {
        console.log('Already exists', a.assetTag);
        continue;
      }
      const created = await prisma.asset.create({ data: a });
      console.log('Created', created.id, created.assetTag);
    }
  } catch (err) {
    console.error('seed error', err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
