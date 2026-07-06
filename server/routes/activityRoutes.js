const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const requireAuth = require('../middlewares/authMiddleware');

router.get('/project/:projectId', requireAuth, activityController.getActivities);
router.post('/', requireAuth, activityController.createActivity);

module.exports = router;
