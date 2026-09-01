'use strict';
const express = require('express');
const router  = express.Router();
const {
  listUsers, getUser, createUser, updateUser,
  deactivateUser, listPermissions, grantPermission, revokePermission,
} = require('../controllers/usersController');
const { requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { auditLog } = require('../middleware/audit');
const { createUserSchema, updateUserSchema, grantPermissionSchema } = require('../schemas');

router.get('/',    requireAdmin, listUsers);
router.get('/:id', requireAdmin, getUser);

router.post('/',
  requireAdmin,
  validate(createUserSchema),
  auditLog('user.create', 'User', (_req, body) => body?.id),
  createUser,
);

router.put('/:id',
  requireAdmin,
  validate(updateUserSchema),
  auditLog('user.update', 'User', (req) => Number(req.params.id)),
  updateUser,
);

router.post('/:id/deactivate',
  requireAdmin,
  auditLog('user.deactivate', 'User', (req) => Number(req.params.id)),
  deactivateUser,
);

// Permission management
router.get('/:id/permissions',  requireAdmin, listPermissions);

router.post('/:id/permissions',
  requireAdmin,
  validate(grantPermissionSchema),
  auditLog('user.permission_grant', 'User', (req) => Number(req.params.id)),
  grantPermission,
);

router.delete('/:id/permissions/:permission',
  requireAdmin,
  auditLog('user.permission_revoke', 'User', (req) => Number(req.params.id)),
  revokePermission,
);

module.exports = router;
