const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

function generateToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name: name || email.split('@')[0], email, passwordHash: hash, role: role || 'DISPATCHER' } });
    return res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ error: 'Failed to register' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'Failed to login' });
  }
};
