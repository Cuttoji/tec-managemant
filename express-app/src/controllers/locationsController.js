const prisma = require('../db');

exports.listLocations = async (req, res) => {
  try {
    const items = await prisma.location.findMany({
      include: { _count: { select: { assets: true } } },
      orderBy: { name: 'asc' },
    });
    return res.json({ items });
  } catch (err) {
    console.error('listLocations', err);
    return res.status(500).json({ error: 'Failed to list locations' });
  }
};

exports.createLocation = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'name required' });
    const loc = await prisma.location.create({ data: { name: name.trim() } });
    return res.status(201).json(loc);
  } catch (err) {
    console.error('createLocation', err);
    return res.status(500).json({ error: 'Failed to create location' });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'name required' });

    const loc = await prisma.location.update({
      where: { id },
      data: { name: name.trim() },
    });
    return res.json(loc);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Location not found' });
    console.error('updateLocation', err);
    return res.status(500).json({ error: 'Failed to update location' });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const count = await prisma.asset.count({ where: { locationId: id } });
    if (count > 0) {
      return res.status(409).json({ error: `Cannot delete: ${count} asset(s) assigned to this location` });
    }
    await prisma.location.delete({ where: { id } });
    return res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Location not found' });
    console.error('deleteLocation', err);
    return res.status(500).json({ error: 'Failed to delete location' });
  }
};
