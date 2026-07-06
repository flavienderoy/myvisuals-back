const express = require('express');
const router = express.Router();
const lookController = require('../controllers/lookController');
const requireAuth = require('../middlewares/authMiddleware');

router.get('/project/:projectId', requireAuth, lookController.getLooks);
router.post('/project/:projectId', requireAuth, lookController.createLook);
router.put('/:id', requireAuth, lookController.updateLook);
router.delete('/:id', requireAuth, lookController.deleteLook);
router.put('/project/:projectId/reorder', requireAuth, lookController.reorderLooks);

module.exports = router;
