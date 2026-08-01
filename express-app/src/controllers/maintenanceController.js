const prisma = require('../db');

exports.createMaintenance = async (req, res) => {
  try {
    const { assetId, issueDetails, notes } = req.body;
    const resolvedIssueDetails = issueDetails || notes;
    if (!assetId || !resolvedIssueDetails) {
      return res.status(400).json({ error: 'assetId and issueDetails required' });
    }

    const m = await prisma.maintenanceLog.create({
      data: {
        assetId: Number(assetId),
        issueDetails: resolvedIssueDetails,
        dispatcherId: Number(req.user.id),
        status: 'OPEN',
      },
    });
    return res.status(201).json(m);
  } catch (err) {
    console.error('createMaintenance', err);
    return res.status(500).json({ error: 'Failed to create maintenance log' });
  }
};

exports.listMaintenance = async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = String(req.query.status);

    const items = await prisma.maintenanceLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        asset: true,
        dispatcher: { select: { id: true, name: true, email: true, role: true } },
        technician: { select: { id: true, name: true, email: true, role: true } },
        reviewer: { select: { id: true, name: true, email: true, role: true } },
        components: true,
      },
    });
    return res.json({ items });
  } catch (err) {
    console.error('listMaintenance', err);
    return res.status(500).json({ error: 'Failed to list maintenance logs' });
  }
};

exports.claimMaintenance = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await prisma.maintenanceLog.updateMany({
      where: { id, technicianId: null, status: 'OPEN' },
      data: { technicianId: Number(req.user.id), status: 'IN_PROGRESS', claimedAt: new Date() },
    });

    if (result.count === 0) {
      return res.status(409).json({ error: 'งานนี้ถูกรับไปแล้ว หรือไม่อยู่ในสถานะที่รับได้' });
    }

    const updated = await prisma.maintenanceLog.findUnique({
      where: { id },
      include: {
        asset: true,
        dispatcher: { select: { id: true, name: true, email: true, role: true } },
        technician: { select: { id: true, name: true, email: true, role: true } },
        reviewer: { select: { id: true, name: true, email: true, role: true } },
        components: true,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error('claimMaintenance', err);
    return res.status(500).json({ error: 'Failed to claim maintenance log' });
  }
};

exports.completeMaintenance = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { repairDetails } = req.body;
    if (!repairDetails) return res.status(400).json({ error: 'repairDetails required' });

    const result = await prisma.maintenanceLog.updateMany({
      where: { id, status: 'IN_PROGRESS', technicianId: Number(req.user.id) },
      data: { repairDetails, status: 'COMPLETED', completedAt: new Date() },
    });

    if (result.count === 0) {
      return res.status(409).json({ error: 'งานนี้ยังไม่อยู่ในสถานะที่ปิดได้ หรือคุณไม่ใช่ช่างที่รับงานนี้ไว้' });
    }

    const updated = await prisma.maintenanceLog.findUnique({
      where: { id },
      include: {
        asset: true,
        dispatcher: { select: { id: true, name: true, email: true, role: true } },
        technician: { select: { id: true, name: true, email: true, role: true } },
        reviewer: { select: { id: true, name: true, email: true, role: true } },
        components: true,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error('completeMaintenance', err);
    return res.status(500).json({ error: 'Failed to complete maintenance log' });
  }
};

exports.reviewMaintenance = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { approved, reviewNotes } = req.body;

    if (typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'approved (boolean) required' });
    }

    const existing = await prisma.maintenanceLog.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.status !== 'COMPLETED') {
      return res.status(409).json({ error: 'งานนี้ยังไม่ถูกปิดโดยช่าง' });
    }

    const data = approved
      ? {
          status: 'REVIEWED',
          reviewedBy: Number(req.user.id),
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || null,
        }
      : {
          status: 'OPEN',
          technicianId: null,
          claimedAt: null,
          completedAt: null,
          repairDetails: null,
          reviewedBy: Number(req.user.id),
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || 'ซ่อมไม่ผ่าน ให้เปิดงานใหม่',
        };

    const updated = await prisma.maintenanceLog.update({
      where: { id },
      data,
      include: {
        asset: true,
        dispatcher: { select: { id: true, name: true, email: true, role: true } },
        technician: { select: { id: true, name: true, email: true, role: true } },
        reviewer: { select: { id: true, name: true, email: true, role: true } },
        components: true,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error('reviewMaintenance', err);
    return res.status(500).json({ error: 'Failed to review maintenance log' });
  }
};
