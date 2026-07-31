const prisma = require('../db');

exports.listLocations = async (req, res) => {
  try {
    const items = await prisma.location.findMany({ include: { assets: true } });
    return res.json({ items });
  } catch (err) {
    console.error('listLocations', err);
    return res.status(500).json({ error: 'Failed to list locations' });
  }
};

exports.createLocation = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const loc = await prisma.location.create({ data: { name } });
    return res.status(201).json(loc);
  } catch (err) {
    console.error('createLocation', err);
    return res.status(500).json({ error: 'Failed to create location' });
  }
};
