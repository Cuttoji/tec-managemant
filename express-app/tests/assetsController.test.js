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

  beforeAll(async () => {
    // create users and an asset in test db
    adminUser = await prisma.user.create({ data: { name: 'Admin', email: 'admin@example.com', passwordHash: 'x', role: 'ADMIN' } });
    dispatcherUser = await prisma.user.create({ data: { name: 'Disp', email: 'disp@example.com', passwordHash: 'x', role: 'DISPATCHER' } });
    asset = await prisma.asset.create({ data: { type: 'Printer', assetTag: 'T-100', needsReview: true } });
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
});
