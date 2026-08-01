const prisma = require('../db');

const INCLUDE_FULL = {
  asset: { include: { location: true } },
  dispatcher: { select: { id: true, name: true, email: true, role: true } },
  technician: { select: { id: true, name: true, email: true, role: true } },
  reviewer: { select: { id: true, name: true, email: true, role: true } },
  loanerAsset: { select: { id: true, assetTag: true, serialNumber: true, model: true } },
  components: true,
};

exports.createMaintenance = async (req, res) => {
  try {
    const { assetId, issueDetails, notes } = req.body;
    const resolvedIssue = issueDetails || notes;
    if (!assetId || !resolvedIssue) {
      return res.status(400).json({ error: 'assetId and issueDetails required' });
    }
    const m = await prisma.maintenanceLog.create({
      data: {
        assetId: Number(assetId),
        issueDetails: resolvedIssue,
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
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 25);
    const skip = (page - 1) * limit;

    const where = {};
    if (req.query.status) where.status = String(req.query.status);

    const [items, total] = await Promise.all([
      prisma.maintenanceLog.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: INCLUDE_FULL,
      }),
      prisma.maintenanceLog.count({ where }),
    ]);
    return res.json({ items, total, page, limit });
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
    const updated = await prisma.maintenanceLog.findUnique({ where: { id }, include: INCLUDE_FULL });
    return res.json(updated);
  } catch (err) {
    console.error('claimMaintenance', err);
    return res.status(500).json({ error: 'Failed to claim maintenance log' });
  }
};

exports.completeMaintenance = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      repairDetails,
      symptom,
      partReplacedAt,
      brand,
      totalPageAtRepair,
      usedLoaner,
      loanerAssetId,
      loanerPageStart,
      loanerPageEnd,
    } = req.body;

    if (!repairDetails) return res.status(400).json({ error: 'repairDetails required' });

    // Validate loaner
    if (usedLoaner && !loanerAssetId) {
      return res.status(400).json({ error: 'loanerAssetId required when usedLoaner is true' });
    }
    if (loanerAssetId) {
      const loaner = await prisma.asset.findUnique({ where: { id: Number(loanerAssetId) } });
      if (!loaner) return res.status(404).json({ error: 'Loaner asset not found' });
    }

    const result = await prisma.maintenanceLog.updateMany({
      where: { id, status: 'IN_PROGRESS', technicianId: Number(req.user.id) },
      data: {
        repairDetails,
        symptom: symptom || null,
        partReplacedAt: partReplacedAt ? new Date(partReplacedAt) : null,
        brand: brand || null,
        totalPageAtRepair: totalPageAtRepair ? Number(totalPageAtRepair) : null,
        usedLoaner: Boolean(usedLoaner),
        loanerAssetId: loanerAssetId ? Number(loanerAssetId) : null,
        loanerPageStart: loanerPageStart ? Number(loanerPageStart) : null,
        loanerPageEnd: loanerPageEnd ? Number(loanerPageEnd) : null,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return res.status(409).json({ error: 'งานนี้ยังไม่อยู่ในสถานะที่ปิดได้ หรือคุณไม่ใช่ช่างที่รับงานนี้ไว้' });
    }

    const updated = await prisma.maintenanceLog.findUnique({ where: { id }, include: INCLUDE_FULL });
    return res.json(updated);
  } catch (err) {
    console.error('completeMaintenance', err);
    return res.status(500).json({ error: 'Failed to complete maintenance log' });
  }
};

// PUT /maintenance/:id/details — แก้ repair details หลัง complete (technician เจ้าของงาน หรือ ADMIN)
exports.updateRepairDetails = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.maintenanceLog.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    // Only the assigned technician or ADMIN can edit
    if (req.user.role !== 'ADMIN' && Number(existing.technicianId) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Only the assigned technician or ADMIN can edit repair details' });
    }

    const {
      symptom, partReplacedAt, brand, totalPageAtRepair,
      repairDetails, usedLoaner, loanerAssetId, loanerPageStart, loanerPageEnd,
    } = req.body;

    if (usedLoaner && !loanerAssetId) {
      return res.status(400).json({ error: 'loanerAssetId required when usedLoaner is true' });
    }
    if (loanerAssetId) {
      const loaner = await prisma.asset.findUnique({ where: { id: Number(loanerAssetId) } });
      if (!loaner) return res.status(404).json({ error: 'Loaner asset not found' });
    }

    const data = {};
    if (symptom !== undefined) data.symptom = symptom;
    if (partReplacedAt !== undefined) data.partReplacedAt = partReplacedAt ? new Date(partReplacedAt) : null;
    if (brand !== undefined) data.brand = brand;
    if (totalPageAtRepair !== undefined) data.totalPageAtRepair = totalPageAtRepair ? Number(totalPageAtRepair) : null;
    if (repairDetails !== undefined) data.repairDetails = repairDetails;
    if (usedLoaner !== undefined) data.usedLoaner = Boolean(usedLoaner);
    if (loanerAssetId !== undefined) data.loanerAssetId = loanerAssetId ? Number(loanerAssetId) : null;
    if (loanerPageStart !== undefined) data.loanerPageStart = loanerPageStart ? Number(loanerPageStart) : null;
    if (loanerPageEnd !== undefined) data.loanerPageEnd = loanerPageEnd ? Number(loanerPageEnd) : null;

    const updated = await prisma.maintenanceLog.update({
      where: { id }, data, include: INCLUDE_FULL,
    });
    return res.json(updated);
  } catch (err) {
    console.error('updateRepairDetails', err);
    return res.status(500).json({ error: 'Failed to update repair details' });
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
          symptom: null,
          partReplacedAt: null,
          brand: null,
          totalPageAtRepair: null,
          usedLoaner: false,
          loanerAssetId: null,
          loanerPageStart: null,
          loanerPageEnd: null,
          reviewedBy: Number(req.user.id),
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || 'ซ่อมไม่ผ่าน ให้เปิดงานใหม่',
        };

    const updated = await prisma.maintenanceLog.update({
      where: { id }, data, include: INCLUDE_FULL,
    });
    return res.json(updated);
  } catch (err) {
    console.error('reviewMaintenance', err);
    return res.status(500).json({ error: 'Failed to review maintenance log' });
  }
};

exports.addComponent = async (req, res) => {
  try {
    const maintenanceId = Number(req.params.id);
    const { part, quantity } = req.body;
    if (!part || !part.trim()) return res.status(400).json({ error: 'part required' });
    if (!quantity || Number(quantity) < 1) return res.status(400).json({ error: 'quantity must be >= 1' });

    const exists = await prisma.maintenanceLog.findUnique({ where: { id: maintenanceId } });
    if (!exists) return res.status(404).json({ error: 'Maintenance log not found' });

    const component = await prisma.componentLog.create({
      data: { maintenanceId, part: part.trim(), quantity: Number(quantity) },
    });
    return res.status(201).json(component);
  } catch (err) {
    console.error('addComponent', err);
    return res.status(500).json({ error: 'Failed to add component' });
  }
};

exports.listComponents = async (req, res) => {
  try {
    const maintenanceId = Number(req.params.id);
    const exists = await prisma.maintenanceLog.findUnique({ where: { id: maintenanceId } });
    if (!exists) return res.status(404).json({ error: 'Maintenance log not found' });

    const items = await prisma.componentLog.findMany({ where: { maintenanceId } });
    return res.json({ items });
  } catch (err) {
    console.error('listComponents', err);
    return res.status(500).json({ error: 'Failed to list components' });
  }
};
