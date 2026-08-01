const prisma = require('../db');

exports.listAssets = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 25);
    const skip = (page - 1) * limit;

    const where = {};
    if (req.query.serial) where.serialNumber = { contains: req.query.serial };
    if (req.query.assetTag) where.assetTag = { contains: req.query.assetTag };
    if (req.query.model) where.model = { contains: req.query.model };

    const [items, total] = await Promise.all([
      prisma.asset.findMany({ where, skip, take: limit, orderBy: { id: 'desc' } }),
      prisma.asset.count({ where }),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error('listAssets error', err);
    return res.status(500).json({ error: 'Failed to list assets' });
  }
};

exports.getAsset = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const asset = await prisma.asset.findUnique({ where: { id }, include: { pageCounters: { orderBy: { recordedAt: 'desc' }, take: 5 } } });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    return res.json(asset);
  } catch (err) {
    console.error('getAsset error', err);
    return res.status(500).json({ error: 'Failed to get asset' });
  }
};

exports.approveAsset = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        needsReview: false,
        isActive: true,
        approvedBy: req.user.id,
        approvedAt: new Date(),
        rejectedBy: null,
        rejectedAt: null,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error('approveAsset error', err);
    return res.status(500).json({ error: 'Failed to approve asset' });
  }
};

exports.rejectAsset = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        needsReview: false,
        isActive: false,
        rejectedBy: req.user.id,
        rejectedAt: new Date(),
        approvedBy: null,
        approvedAt: null,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error('rejectAsset error', err);
    return res.status(500).json({ error: 'Failed to reject asset' });
  }
};
