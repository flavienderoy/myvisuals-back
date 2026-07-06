const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const requireAuth = require('../middlewares/authMiddleware');

router.get('/', requireAuth, auditLogController.getAuditLogs);
router.post('/', requireAuth, auditLogController.createAuditLog);

module.exports = router;
