const jwt = require('jsonwebtoken');
const prisma = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

exports.requireAuth = async (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing auth token' });
  const token = h.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // attach user minimal info
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

exports.requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
  next();
};

exports.requireAdmin = (req, res, next) => {
  // Ensure user is authenticated first
  exports.requireAuth(req, res, (err) => {
    if (err) return; // requireAuth already handled response
    return exports.requireRole('ADMIN')(req, res, next);
  });
};
