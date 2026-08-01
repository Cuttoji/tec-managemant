const request = require('supertest');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_SECRET = JWT_SECRET;

const app = require('../src/index');
const prisma = require('../src/db');

function makeToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET);
}

describe('Maintenance workflow', () => {
  let dispatcherUser;
  let adminUser;
  let technicianA;
  let technicianB;
  let asset;
  const createdMaintenanceIds = [];
  const createdAssetIds = [];
  const createdUserIds = [];

  beforeAll(async () => {
    const suffix = Date.now();

    dispatcherUser = await prisma.user.create({
      data: { name: 'Dispatcher', email: `dispatcher-${suffix}@example.com`, passwordHash: 'x', role: 'ADMIN' },
    });
    createdUserIds.push(dispatcherUser.id);
    adminUser = dispatcherUser;
    technicianA = await prisma.user.create({
      data: { name: 'Tech A', email: `tech-a-${suffix}@example.com`, passwordHash: 'x', role: 'TECHNICIAN' },
    });
    createdUserIds.push(technicianA.id);
    technicianB = await prisma.user.create({
      data: { name: 'Tech B', email: `tech-b-${suffix}@example.com`, passwordHash: 'x', role: 'TECHNICIAN' },
    });
    createdUserIds.push(technicianB.id);
    asset = await prisma.asset.create({ data: { type: 'Printer', assetTag: `MAINT-${suffix}`, model: 'Test Model', needsReview: false } });
    createdAssetIds.push(asset.id);
  });

  afterAll(async () => {
    await prisma.componentLog.deleteMany({ where: { maintenanceId: { in: createdMaintenanceIds } } });
    await prisma.maintenanceLog.deleteMany({ where: { id: { in: createdMaintenanceIds } } });
    await prisma.pageCounterLog.deleteMany({ where: { assetId: { in: createdAssetIds } } });
    await prisma.asset.deleteMany({ where: { id: { in: createdAssetIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
  });

  test('dispatcher can open a maintenance log', async () => {
    const res = await request(app)
      .post('/maintenance')
      .set('Authorization', `Bearer ${makeToken(dispatcherUser)}`)
      .send({ assetId: asset.id, issueDetails: 'Printer jam on tray 2' });

    expect(res.status).toBe(201);
    expect(res.body.assetId).toBe(asset.id);
    expect(res.body.issueDetails).toBe('Printer jam on tray 2');
    expect(res.body.status).toBe('OPEN');
    expect(res.body.dispatcherId).toBe(dispatcherUser.id);
    createdMaintenanceIds.push(res.body.id);
  });

  test('technician claim is race-safe', async () => {
    const created = await prisma.maintenanceLog.create({
      data: {
        assetId: asset.id,
        dispatcherId: dispatcherUser.id,
        issueDetails: 'Network issue',
        status: 'OPEN',
      },
    });
    createdMaintenanceIds.push(created.id);

    const first = await request(app)
      .post(`/maintenance/${created.id}/claim`)
      .set('Authorization', `Bearer ${makeToken(technicianA)}`);

    expect(first.status).toBe(200);
    expect(first.body.status).toBe('IN_PROGRESS');
    expect(first.body.technicianId).toBe(technicianA.id);

    const second = await request(app)
      .post(`/maintenance/${created.id}/claim`)
      .set('Authorization', `Bearer ${makeToken(technicianB)}`);

    expect(second.status).toBe(409);
  });

  test('only the claiming technician can complete the job', async () => {
    const created = await prisma.maintenanceLog.create({
      data: {
        assetId: asset.id,
        dispatcherId: dispatcherUser.id,
        issueDetails: 'Toner replacement',
        status: 'OPEN',
      },
    });
    createdMaintenanceIds.push(created.id);

    const claimed = await request(app)
      .post(`/maintenance/${created.id}/claim`)
      .set('Authorization', `Bearer ${makeToken(technicianA)}`);
    expect(claimed.status).toBe(200);

    const wrongTech = await request(app)
      .post(`/maintenance/${created.id}/complete`)
      .set('Authorization', `Bearer ${makeToken(technicianB)}`)
      .send({ repairDetails: 'Fixed' });

    expect(wrongTech.status).toBe(409);

    const complete = await request(app)
      .post(`/maintenance/${created.id}/complete`)
      .set('Authorization', `Bearer ${makeToken(technicianA)}`)
      .send({ repairDetails: 'Replaced toner cartridge' });

    expect(complete.status).toBe(200);
    expect(complete.body.status).toBe('COMPLETED');
    expect(complete.body.repairDetails).toBe('Replaced toner cartridge');
    expect(complete.body.completedAt).toBeTruthy();
  });

  test('review reopen clears technician and completion fields', async () => {
    const created = await prisma.maintenanceLog.create({
      data: {
        assetId: asset.id,
        dispatcherId: dispatcherUser.id,
        issueDetails: 'Paper feed issue',
        status: 'OPEN',
      },
    });
    createdMaintenanceIds.push(created.id);

    await request(app)
      .post(`/maintenance/${created.id}/claim`)
      .set('Authorization', `Bearer ${makeToken(technicianA)}`)
      .expect(200);

    await request(app)
      .post(`/maintenance/${created.id}/complete`)
      .set('Authorization', `Bearer ${makeToken(technicianA)}`)
      .send({ repairDetails: 'Cleaned rollers' })
      .expect(200);

    const reviewed = await request(app)
      .post(`/maintenance/${created.id}/review`)
      .set('Authorization', `Bearer ${makeToken(adminUser)}`)
      .send({ approved: false, reviewNotes: 'Still jams, reopen' });

    expect(reviewed.status).toBe(200);
    expect(reviewed.body.status).toBe('OPEN');
    expect(reviewed.body.technicianId).toBeNull();
    expect(reviewed.body.claimedAt).toBeNull();
    expect(reviewed.body.completedAt).toBeNull();
    expect(reviewed.body.repairDetails).toBeNull();
    expect(reviewed.body.reviewNotes).toBe('Still jams, reopen');
  });
});