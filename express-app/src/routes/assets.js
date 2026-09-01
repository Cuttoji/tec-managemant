'use strict';
const express = require('express');
const router  = express.Router();
const {
  listAssets, getAsset, createAsset, updateAsset,
  retireAsset, approveAsset, rejectAsset,
} = require('../controllers/assetsController');
const { requireAuth, requireAdmin, requirePermission } = require('../middleware/auth');
const { validate }  = require('../middleware/validate');
const { auditLog }  = require('../middleware/audit');
const { createAssetSchema, updateAssetSchema } = require('../schemas');
const prisma = require('../db');

router.get('/',    requireAuth, listAssets);
router.get('/:id', requireAuth, getAsset);

router.post('/',
  requireAdmin,
  validate(createAssetSchema),
  auditLog('asset.create', 'Asset', (_req, body) => body?.id),
  createAsset,
);

router.put('/:id',
  requireAuth,
  requirePermission('asset:edit'),
  validate(updateAssetSchema),
  auditLog('asset.update', 'Asset',
    (req) => Number(req.params.id),
    async (req) => {
      const a = await prisma.asset.findUnique({ where: { id: Number(req.params.id) } });
      return a;
    },
  ),
  updateAsset,
);

router.post('/:id/retire',
  requireAdmin,
  auditLog('asset.retire', 'Asset', (req) => Number(req.params.id)),
  retireAsset,
);

router.post('/:id/approve',
  requireAdmin,
  auditLog('asset.approve', 'Asset', (req) => Number(req.params.id)),
  approveAsset,
);

router.post('/:id/reject',
  requireAdmin,
  auditLog('asset.reject', 'Asset', (req) => Number(req.params.id)),
  rejectAsset,
);

module.exports = router;
