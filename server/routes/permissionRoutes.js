const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const requireAuth = require('../middlewares/authMiddleware');

router.get('/', requireAuth, permissionController.getPermissions);
router.post('/', requireAuth, permissionController.setPermission);
router.delete('/', requireAuth, permissionController.revokePermission);

module.exports = router;
