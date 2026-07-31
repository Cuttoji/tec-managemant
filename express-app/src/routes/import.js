const express = require('express');
const router = express.Router();
const { handleBrAdminImport, handleBrAdminCsvImport, listImportLogs, getImportLog } = require('../controllers/importController');
const { requireAuth, requireRole, requireAdmin } = require('../middleware/auth');
const { importRateLimiter } = require('../middleware/rateLimiter');

// Require admin for imports and apply rate limiting
router.post('/bradmin', requireAdmin, importRateLimiter, handleBrAdminImport);
router.post('/bradmin/csv', requireAdmin, importRateLimiter, handleBrAdminCsvImport);
router.get('/logs', requireAuth, requireRole('ADMIN'), listImportLogs);
router.get('/logs/:id', requireAuth, requireRole('ADMIN'), getImportLog);

module.exports = router;
