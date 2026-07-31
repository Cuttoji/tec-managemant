const prisma = require('../db');

exports.listUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } });
    return res.json({ items: users });
  } catch (err) {
    console.error('listUsers', err);
    return res.status(500).json({ error: 'Failed to list users' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error('getUser', err);
    return res.status(500).json({ error: 'Failed to get user' });
  }
};
