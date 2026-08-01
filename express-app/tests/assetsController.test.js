const request = require('supertest');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_SECRET = JWT_SECRET;

const app = require('../src/index');
const prisma = require('../src/db');

function makeToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET);
}

describe('Assets approve/reject', () => {
  let adminUser;
  let dispatcherUser;
  let asset;
  let modelAsset;

  beforeAll(async () => {
    // create users and an asset in test db
    adminUser = await prisma.user.create({ data: { name: 'Admin', email: 'admin@example.com', passwordHash: 'x', role: 'ADMIN' } });
    dispatcherUser = await prisma.user.create({ data: { name: 'Disp', email: 'disp@example.com', passwordHash: 'x', role: 'DISPATCHER' } });
    asset = await prisma.asset.create({ data: { type: 'Printer', assetTag: 'T-100', needsReview: true } });
    modelAsset = await prisma.asset.create({ data: { type: 'Computer', assetTag: 'T-200', model: 'OptiPlex 7090', needsReview: true } });
  });

  afterAll(async () => {
    await prisma.pageCounterLog.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  test('non-admin cannot approve', async () => {
    const token = makeToken(dispatcherUser);
    const res = await request(app).post(`/assets/${asset.id}/approve`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('listAssets filters by model field', async () => {
    const token = makeToken(dispatcherUser);
    const res = await request(app).get('/assets?model=OptiPlex').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].id).toBe(modelAsset.id);
    expect(res.body.items[0].model).toBe('OptiPlex 7090');
  });

  test('admin can approve', async () => {
    const token = makeToken(adminUser);
    const res = await request(app).post(`/assets/${asset.id}/approve`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.needsReview).toBe(false);
    expect(res.body.isActive).toBe(true);
    expect(res.body.approvedBy).toBe(adminUser.id);
  });

  test('admin can reject', async () => {
    // create another asset to reject
    const a2 = await prisma.asset.create({ data: { type: 'Router', assetTag: 'R-1', needsReview: true } });
    const token = makeToken(adminUser);
    const res = await request(app).post(`/assets/${a2.id}/reject`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.needsReview).toBe(false);
    expect(res.body.isActive).toBe(false);
    expect(res.body.rejectedBy).toBe(adminUser.id);
  });

  test('approving after reject clears rejection fields', async () => {
    const rejectedAsset = await prisma.asset.create({ data: { type: 'Switch', assetTag: 'R-2', needsReview: true } });
    const adminToken = makeToken(adminUser);

    const rejected = await request(app)
      .post(`/assets/${rejectedAsset.id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(rejected.status).toBe(200);
    expect(rejected.body.rejectedBy).toBe(adminUser.id);
    expect(rejected.body.approvedBy).toBeNull();

    const approved = await request(app)
      .post(`/assets/${rejectedAsset.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(approved.status).toBe(200);
    expect(approved.body.approvedBy).toBe(adminUser.id);
    expect(approved.body.rejectedBy).toBeNull();
    expect(approved.body.rejectedAt).toBeNull();
  });
});
