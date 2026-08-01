const express = require('express');
const router = express.Router();
const {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
  listPermissions,
  grantPermission,
  revokePermission,
} = require('../controllers/usersController');
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, listUsers);
router.get('/:id', requireAdmin, getUser);
router.post('/', requireAdmin, createUser);
router.put('/:id', requireAdmin, updateUser);
router.post('/:id/deactivate', requireAdmin, deactivateUser);

// Permission management — admin only
router.get('/:id/permissions', requireAdmin, listPermissions);
router.post('/:id/permissions', requireAdmin, grantPermission);
router.delete('/:id/permissions/:permission', requireAdmin, revokePermission);

module.exports = router;
