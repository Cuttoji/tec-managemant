const express = require('express');
const router = express.Router();
const { listLocations, createLocation } = require('../controllers/locationsController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, listLocations);
router.post('/', requireAuth, createLocation);

module.exports = router;
