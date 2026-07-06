const express = require('express');
const router = express.Router();
const watermarkController = require('../controllers/watermarkController');
const requireAuth = require('../middlewares/authMiddleware');

router.get('/', requireAuth, watermarkController.getSettings);
router.put('/', requireAuth, watermarkController.saveSettings);

module.exports = router;
