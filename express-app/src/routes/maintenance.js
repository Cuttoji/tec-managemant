const express = require('express');
const router = express.Router();
const {
	createMaintenance,
	listMaintenance,
	claimMaintenance,
	completeMaintenance,
	reviewMaintenance,
} = require('../controllers/maintenanceController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, listMaintenance);
router.post('/', requireAuth, createMaintenance);
router.post('/:id/claim', requireAuth, claimMaintenance);
router.post('/:id/complete', requireAuth, completeMaintenance);
router.post('/:id/review', requireAdmin, reviewMaintenance);

module.exports = router;
