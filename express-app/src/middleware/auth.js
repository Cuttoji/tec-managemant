const jwt = require('jsonwebtoken');
const prisma = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

// Permissions that are default for every TECHNICIAN and cannot be revoked
const DEFAULT_PERMISSIONS = ['maintenance:claim', 'maintenance:complete', 'maintenance:edit'];

// Permissions that admin can explicitly grant/revoke per user
const GRANTABLE_PERMISSIONS = ['asset:edit', 'location:manage'];

exports.DEFAULT_PERMISSIONS = DEFAULT_PERMISSIONS;
exports.GRANTABLE_PERMISSIONS = GRANTABLE_PERMISSIONS;
exports.ALL_PERMISSIONS = [...DEFAULT_PERMISSIONS, ...GRANTABLE_PERMISSIONS];

exports.requireAuth = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing auth token' });
  }
  const token = h.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
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
  exports.requireAuth(req, res, () => {
    exports.requireRole('ADMIN')(req, res, next);
  });
};

exports.requireTechOrAdmin = (req, res, next) => {
  exports.requireAuth(req, res, () => {
    if (!['ADMIN', 'TECHNICIAN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  });
};

/**
 * requirePermission(permission)
 * - ADMIN: always passes
 * - TECHNICIAN with DEFAULT_PERMISSIONS: always passes (no DB hit)
 * - TECHNICIAN with GRANTABLE_PERMISSIONS: checks UserPermission table
 */
exports.requirePermission = (permission) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  // ADMIN bypasses all permission checks
  if (req.user.role === 'ADMIN') return next();

  // Default permissions are always granted to TECHNICIAN — no DB lookup needed
  if (DEFAULT_PERMISSIONS.includes(permission)) return next();

  // For grantable permissions, check the DB
  try {
    const perm = await prisma.userPermission.findUnique({
      where: {
        userId_permission: {
          userId: Number(req.user.id),
          permission,
        },
      },
    });
    if (!perm) {
      return res.status(403).json({ error: `Permission denied: ${permission}` });
    }
    next();
  } catch (err) {
    console.error('requirePermission error', err);
    return res.status(500).json({ error: 'Permission check failed' });
  }
};
