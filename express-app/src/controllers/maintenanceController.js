const prisma = require('../db');

exports.createMaintenance = async (req, res) => {
  try {
    const { assetId, notes } = req.body;
    if (!assetId) return res.status(400).json({ error: 'assetId required' });
    const m = await prisma.maintenanceLog.create({ data: { assetId, notes, createdBy: req.user?.id || null } });
    return res.status(201).json(m);
  } catch (err) {
    console.error('createMaintenance', err);
    return res.status(500).json({ error: 'Failed to create maintenance log' });
  }
};

exports.listMaintenance = async (req, res) => {
  try {
    const items = await prisma.maintenanceLog.findMany({ include: { components: true } });
    return res.json({ items });
  } catch (err) {
    console.error('listMaintenance', err);
    return res.status(500).json({ error: 'Failed to list maintenance logs' });
  }
};
