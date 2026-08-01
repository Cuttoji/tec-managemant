const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { DEFAULT_PERMISSIONS, GRANTABLE_PERMISSIONS } = require('../middleware/auth');

const VALID_ROLES = ['ADMIN', 'TECHNICIAN'];

// ------------------------------------------------------------------ helpers

async function seedDefaultPermissions(userId, grantedBy) {
  await prisma.userPermission.createMany({
    data: DEFAULT_PERMISSIONS.map((permission) => ({
      userId,
      permission,
      grantedBy,
    })),
    skipDuplicates: true,
  });
}

// ------------------------------------------------------------------ CRUD

exports.listUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, email: true, role: true,
        primarySkill: true, createdAt: true,
        permissions: { select: { permission: true } },
      },
      orderBy: { id: 'asc' },
    });
    // flatten permissions to string[]
    const items = users.map((u) => ({
      ...u,
      permissions: u.permissions.map((p) => p.permission),
    }));
    return res.json({ items });
  } catch (err) {
    console.error('listUsers', err);
    return res.status(500).json({ error: 'Failed to list users' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true,
        primarySkill: true, isActive: true, createdAt: true,
        permissions: { select: { permission: true, grantedAt: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({
      ...user,
      permissions: user.permissions.map((p) => p.permission),
    });
  } catch (err) {
    console.error('getUser', err);
    return res.status(500).json({ error: 'Failed to get user' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, primarySkill } = req.body;
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
        primarySkill: primarySkill || null,
      },
    });

    // Seed default permissions for TECHNICIAN
    if (assignedRole === 'TECHNICIAN') {
      await seedDefaultPermissions(user.id, Number(req.user.id));
    }

    return res.status(201).json({
      id: user.id, name: user.name, email: user.email, role: user.role,
      permissions: assignedRole === 'TECHNICIAN' ? DEFAULT_PERMISSIONS : [],
    });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already exists' });
    console.error('createUser', err);
    return res.status(500).json({ error: 'Failed to create user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, role, primarySkill } = req.body;
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
    }
    const data = {};
    if (name !== undefined) data.name = name;
    if (role !== undefined) data.role = role;
    if (primarySkill !== undefined) data.primarySkill = primarySkill;

    const user = await prisma.user.update({ where: { id }, data });
    return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    console.error('updateUser', err);
    return res.status(500).json({ error: 'Failed to update user' });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (id === Number(req.user.id)) {
      return res.status(400).json({ error: 'Cannot deactivate yourself' });
    }
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    console.error('deactivateUser', err);
    return res.status(500).json({ error: 'Failed to deactivate user' });
  }
};

// ------------------------------------------------------------------ permission management

exports.listPermissions = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const perms = await prisma.userPermission.findMany({
      where: { userId: id },
      select: { permission: true, grantedAt: true },
      orderBy: { grantedAt: 'asc' },
    });
    return res.json({ permissions: perms.map((p) => p.permission) });
  } catch (err) {
    console.error('listPermissions', err);
    return res.status(500).json({ error: 'Failed to list permissions' });
  }
};

exports.grantPermission = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { permission } = req.body;

    if (!GRANTABLE_PERMISSIONS.includes(permission)) {
      return res.status(400).json({
        error: `permission must be one of: ${GRANTABLE_PERMISSIONS.join(', ')}`,
      });
    }

    // Ensure the user exists and is a TECHNICIAN
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role !== 'TECHNICIAN') {
      return res.status(400).json({ error: 'Permissions can only be granted to TECHNICIAN users' });
    }

    const perm = await prisma.userPermission.create({
      data: { userId, permission, grantedBy: Number(req.user.id) },
    });
    return res.status(201).json({ permission: perm.permission });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Permission already granted' });
    console.error('grantPermission', err);
    return res.status(500).json({ error: 'Failed to grant permission' });
  }
};

exports.revokePermission = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { permission } = req.params;

    // Default permissions cannot be revoked
    if (DEFAULT_PERMISSIONS.includes(permission)) {
      return res.status(400).json({ error: 'Default permissions cannot be revoked' });
    }
    if (!GRANTABLE_PERMISSIONS.includes(permission)) {
      return res.status(400).json({ error: `Unknown permission: ${permission}` });
    }

    await prisma.userPermission.delete({
      where: { userId_permission: { userId, permission } },
    });
    return res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Permission not found' });
    console.error('revokePermission', err);
    return res.status(500).json({ error: 'Failed to revoke permission' });
  }
};
