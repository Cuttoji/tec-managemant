const request = require('supertest');
const app = require('../src/index');

test('login route is available without the /auth prefix', async () => {
  const res = await request(app)
    .post('/login')
    .send({});

  expect(res.status).toBe(400);
  expect(res.body.error).toBeDefined();
});
