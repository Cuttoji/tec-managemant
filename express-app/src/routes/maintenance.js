const express = require('express');
const router = express.Router();
const {
  createMaintenance,
  listMaintenance,
  claimMaintenance,
  completeMaintenance,
  updateRepairDetails,
  reviewMaintenance,
  addComponent,
  listComponents,
} = require('../controllers/maintenanceController');
const { requireAuth, requireAdmin, requireTechOrAdmin, requirePermission } = require('../middleware/auth');

router.get('/', requireAuth, listMaintenance);
router.post('/', requireAdmin, createMaintenance);
router.post('/:id/claim', requireTechOrAdmin, claimMaintenance);
router.post('/:id/complete', requireTechOrAdmin, completeMaintenance);
router.put('/:id/details', requireAuth, requirePermission('maintenance:edit'), updateRepairDetails);
router.post('/:id/review', requireAdmin, reviewMaintenance);
router.post('/:id/components', requireAuth, addComponent);
router.get('/:id/components', requireAuth, listComponents);

module.exports = router;
