'use strict';
const express = require('express');
const router  = express.Router();
const {
  listLocations, createLocation, updateLocation,
  deleteLocation, uploadMapImage, deleteMapImage,
} = require('../controllers/locationsController');
const { requireAuth, requireAdmin, requirePermission } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { auditLog } = require('../middleware/audit');
const { createLocationSchema, updateLocationSchema } = require('../schemas');

router.get('/', requireAuth, listLocations);

router.post('/',
  requireAuth,
  requirePermission('location:manage'),
  validate(createLocationSchema),
  auditLog('location.create', 'Location', (_req, body) => body?.id),
  createLocation,
);

router.put('/:id',
  requireAuth,
  requirePermission('location:manage'),
  validate(updateLocationSchema),
  auditLog('location.update', 'Location', (req) => Number(req.params.id)),
  updateLocation,
);

router.delete('/:id',
  requireAdmin,
  auditLog('location.delete', 'Location', (req) => Number(req.params.id)),
  deleteLocation,
);

router.post('/:id/map-image',
  requireAdmin,
  auditLog('location.map_upload', 'Location', (req) => Number(req.params.id)),
  uploadMapImage,
);

router.delete('/:id/map-image',
  requireAdmin,
  auditLog('location.map_delete', 'Location', (req) => Number(req.params.id)),
  deleteMapImage,
);

module.exports = router;
