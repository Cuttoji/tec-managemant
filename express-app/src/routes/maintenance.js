const express = require('express');
const router = express.Router();
const { createMaintenance, listMaintenance } = require('../controllers/maintenanceController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, listMaintenance);
router.post('/', requireAuth, createMaintenance);

module.exports = router;
