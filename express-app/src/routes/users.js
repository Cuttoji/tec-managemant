const express = require('express');
const router = express.Router();
const { listUsers, getUser } = require('../controllers/usersController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', requireAuth, requireRole('ADMIN'), listUsers);
router.get('/:id', requireAuth, requireRole('ADMIN'), getUser);

module.exports = router;
