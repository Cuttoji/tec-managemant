const express = require('express');
const router = express.Router();
const {
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  uploadMapImage,
  deleteMapImage,
} = require('../controllers/locationsController');
const { requireAuth, requireAdmin, requirePermission } = require('../middleware/auth');

router.get('/',          requireAuth, listLocations);
router.post('/',         requireAuth, requirePermission('location:manage'), createLocation);
router.put('/:id',       requireAuth, requirePermission('location:manage'), updateLocation);
router.delete('/:id',    requireAdmin, deleteLocation);
router.post('/:id/map-image',   requireAdmin, uploadMapImage);
router.delete('/:id/map-image', requireAdmin, deleteMapImage);

module.exports = router;
