const express = require('express');
const router = express.Router();
const annotationController = require('../controllers/annotationController');
const requireAuth = require('../middlewares/authMiddleware');

router.use(requireAuth);

// Ticket-specific routes (must be before /:id to avoid route conflicts)
router.get('/tickets', annotationController.getTickets);
router.patch('/:id/resolve', annotationController.resolveAnnotation);
router.patch('/:id/reopen', annotationController.reopenAnnotation);

// Standard CRUD
router.get('/', annotationController.getAnnotations);
router.post('/', annotationController.createAnnotation);
router.put('/:id', annotationController.updateAnnotation);
router.delete('/:id', annotationController.deleteAnnotation);

module.exports = router;
