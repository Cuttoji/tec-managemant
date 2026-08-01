const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { DEFAULT_PERMISSIONS } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET;
const VALID_ROLES = ['ADMIN', 'TECHNICIAN'];

function generateToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// Bootstrap endpoint — use POST /users for normal user creation
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }
    const assignedRole = role || 'TECHNICIAN';
    if (!VALID_ROLES.includes(assignedRole)) {
      return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name || email.split('@')[0],
        email,
        passwordHash: hash,
        role: assignedRole,
      },
    });

    // Seed default permissions for TECHNICIAN
    if (assignedRole === 'TECHNICIAN') {
      await prisma.userPermission.createMany({
        data: DEFAULT_PERMISSIONS.map((permission) => ({
          userId: user.id,
          permission,
          grantedBy: user.id, // self-bootstrapped
        })),
        skipDuplicates: true,
      });
    }

    return res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already exists' });
    console.error('register error', err);
    return res.status(500).json({ error: 'Failed to register' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);

    // Build permissions list:
    // - ADMIN: all permissions (no DB lookup needed)
    // - TECHNICIAN: DEFAULT + any granted in UserPermission table
    let permissions;
    if (user.role === 'ADMIN') {
      permissions = [...DEFAULT_PERMISSIONS, 'asset:edit', 'location:manage'];
    } else {
      const rows = await prisma.userPermission.findMany({
        where: { userId: user.id },
        select: { permission: true },
      });
      permissions = rows.map((r) => r.permission);
    }

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      permissions,
    });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'Failed to login' });
  }
};
