const express = require('express');
const router = express.Router();
const { listAssets, getAsset } = require('../controllers/assetsController');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');

const { approveAsset, rejectAsset } = require('../controllers/assetsController');

router.get('/', requireAuth, listAssets);
router.get('/:id', requireAuth, getAsset);
router.post('/:id/approve', requireAdmin, approveAsset);
router.post('/:id/reject', requireAdmin, rejectAsset);

module.exports = router;
