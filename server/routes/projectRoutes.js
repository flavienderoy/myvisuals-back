const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const requireAuth = require('../middlewares/authMiddleware');

router.get('/stats', requireAuth, projectController.getDashboardStats);
router.get('/', requireAuth, projectController.getProjects);
router.get('/:id', requireAuth, projectController.getProjectById);
router.post('/', requireAuth, projectController.createProject);
router.put('/:id', requireAuth, projectController.updateProject);
router.delete('/:id', requireAuth, projectController.deleteProject);
router.get('/:id/members', requireAuth, projectController.getProjectMembers);

module.exports = router;
