const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// No auth — read-only shared project view
router.get('/share/:token', publicController.getSharedProject);

module.exports = router;
