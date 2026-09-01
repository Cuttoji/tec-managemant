'use strict';
const express = require('express');
const router  = express.Router();
const {
  createMaintenance, listMaintenance, claimMaintenance,
  completeMaintenance, updateRepairDetails, reviewMaintenance,
  addComponent, listComponents,
} = require('../controllers/maintenanceController');
const { requireAuth, requireAdmin, requireTechOrAdmin, requirePermission } = require('../middleware/auth');
const { validate }  = require('../middleware/validate');
const { auditLog }  = require('../middleware/audit');
const {
  createMaintenanceSchema,
  completeMaintenanceSchema,
  reviewMaintenanceSchema,
  addComponentSchema,
} = require('../schemas');
const prisma = require('../db');

router.get('/',  requireAuth, listMaintenance);

router.post('/',
  requireAdmin,
  validate(createMaintenanceSchema),
  auditLog('maintenance.create', 'MaintenanceLog', (_req, body) => body?.id),
  createMaintenance,
);

router.post('/:id/claim',
  requireTechOrAdmin,
  auditLog('maintenance.claim', 'MaintenanceLog', (req) => Number(req.params.id)),
  claimMaintenance,
);

router.post('/:id/complete',
  requireTechOrAdmin,
  validate(completeMaintenanceSchema),
  auditLog('maintenance.complete', 'MaintenanceLog',
    (req) => Number(req.params.id),
    async (req) => {
      const m = await prisma.maintenanceLog.findUnique({ where: { id: Number(req.params.id) }, select: { status: true, repairDetails: true } });
      return m;
    },
  ),
  completeMaintenance,
);

router.put('/:id/details',
  requireAuth,
  requirePermission('maintenance:edit'),
  auditLog('maintenance.edit_details', 'MaintenanceLog',
    (req) => Number(req.params.id),
    async (req) => {
      const m = await prisma.maintenanceLog.findUnique({ where: { id: Number(req.params.id) }, select: { repairDetails: true, symptom: true, brand: true } });
      return m;
    },
  ),
  updateRepairDetails,
);

router.post('/:id/review',
  requireAdmin,
  validate(reviewMaintenanceSchema),
  auditLog('maintenance.review', 'MaintenanceLog', (req) => Number(req.params.id)),
  reviewMaintenance,
);

router.post('/:id/components',
  requireAuth,
  validate(addComponentSchema),
  addComponent,
);

router.get('/:id/components', requireAuth, listComponents);

module.exports = router;
