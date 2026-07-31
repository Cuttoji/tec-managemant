const { requireRole } = require('../src/middleware/auth');

test('requireRole returns 403 for non-admin', () => {
  const req = { user: { id: 1, role: 'DISPATCHER' } };
  const res = { status: jest.fn(() => res), json: jest.fn() };
  let calledNext = false;
  const next = () => { calledNext = true; };

  const middleware = requireRole('ADMIN');
  middleware(req, res, next);

  expect(res.status).toHaveBeenCalledWith(403);
  expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
  expect(calledNext).toBe(false);
});
