const prisma = require('../db');

const ASSET_FIELDS = [
  'type', 'model', 'serialNumber', 'assetTag', 'locationId',
  'cpu', 'ramGb', 'storageType', 'storageGb', 'purchaseDate',
];

exports.listAssets = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 25);
    const skip = (page - 1) * limit;

    const where = {};
    if (req.query.serial) where.serialNumber = { contains: req.query.serial };
    if (req.query.assetTag) where.assetTag = { contains: req.query.assetTag };
    if (req.query.model) where.model = { contains: req.query.model };
    if (req.query.needsReview === 'true') where.needsReview = true;

    const [items, total] = await Promise.all([
      prisma.asset.findMany({
        where, skip, take: limit, orderBy: { id: 'desc' },
        include: { location: true },
      }),
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
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        location: true,
        pageCounters: { orderBy: { recordedAt: 'desc' }, take: 5 },
      },
    });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    return res.json(asset);
  } catch (err) {
    console.error('getAsset error', err);
    return res.status(500).json({ error: 'Failed to get asset' });
  }
};

exports.createAsset = async (req, res) => {
  try {
    const { type } = req.body;
    if (!type) return res.status(400).json({ error: 'type required' });

    const data = { type };
    for (const f of ASSET_FIELDS.filter((f) => f !== 'type')) {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    }
    if (data.locationId) data.locationId = Number(data.locationId);
    if (data.ramGb) data.ramGb = Number(data.ramGb);
    if (data.storageGb) data.storageGb = Number(data.storageGb);
    if (data.purchaseDate) data.purchaseDate = new Date(data.purchaseDate);

    const asset = await prisma.asset.create({ data });
    return res.status(201).json(asset);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'serialNumber or assetTag already exists' });
    console.error('createAsset error', err);
    return res.status(500).json({ error: 'Failed to create asset' });
  }
};

exports.updateAsset = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = {};
    for (const f of ASSET_FIELDS) {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    }
    if (data.locationId !== undefined) data.locationId = data.locationId ? Number(data.locationId) : null;
    if (data.ramGb !== undefined) data.ramGb = data.ramGb ? Number(data.ramGb) : null;
    if (data.storageGb !== undefined) data.storageGb = data.storageGb ? Number(data.storageGb) : null;
    if (data.purchaseDate !== undefined) data.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;

    const asset = await prisma.asset.update({
      where: { id },
      data,
      include: { location: true },
    });
    return res.json(asset);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Asset not found' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'serialNumber or assetTag already exists' });
    console.error('updateAsset error', err);
    return res.status(500).json({ error: 'Failed to update asset' });
  }
};

exports.retireAsset = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const asset = await prisma.asset.update({
      where: { id },
      data: { isActive: false, retiredAt: new Date() },
    });
    return res.json(asset);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Asset not found' });
    console.error('retireAsset error', err);
    return res.status(500).json({ error: 'Failed to retire asset' });
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
        approvedBy: Number(req.user.id),
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
        rejectedBy: Number(req.user.id),
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
