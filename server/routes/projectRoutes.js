const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const publicController = require('../controllers/publicController');
const requireAuth = require('../middlewares/authMiddleware');

router.get('/stats', requireAuth, projectController.getDashboardStats);
router.get('/', requireAuth, projectController.getProjects);
router.get('/:id', requireAuth, projectController.getProjectById);
router.post('/', requireAuth, projectController.createProject);
router.put('/:id', requireAuth, projectController.updateProject);
router.delete('/:id', requireAuth, projectController.deleteProject);
router.get('/:id/members', requireAuth, projectController.getProjectMembers);

// Public share link management (studio owner only)
router.post('/:id/share', requireAuth, publicController.enableShare);
router.delete('/:id/share', requireAuth, publicController.disableShare);

module.exports = router;
