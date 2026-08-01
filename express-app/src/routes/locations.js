const express = require('express');
const router = express.Router();
const {
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} = require('../controllers/locationsController');
const { requireAuth, requireAdmin, requirePermission } = require('../middleware/auth');

router.get('/', requireAuth, listLocations);
router.post('/', requireAuth, requirePermission('location:manage'), createLocation);
router.put('/:id', requireAuth, requirePermission('location:manage'), updateLocation);
router.delete('/:id', requireAdmin, deleteLocation);

module.exports = router;
