const express = require('express');
const router = express.Router();
const {
  listAssets,
  getAsset,
  createAsset,
  updateAsset,
  retireAsset,
  approveAsset,
  rejectAsset,
} = require('../controllers/assetsController');
const { requireAuth, requireAdmin, requirePermission } = require('../middleware/auth');

router.get('/', requireAuth, listAssets);
router.get('/:id', requireAuth, getAsset);
router.post('/', requireAdmin, createAsset);
router.put('/:id', requireAuth, requirePermission('asset:edit'), updateAsset);
router.post('/:id/retire', requireAdmin, retireAsset);
router.post('/:id/approve', requireAdmin, approveAsset);
router.post('/:id/reject', requireAdmin, rejectAsset);

module.exports = router;
