const express = require('express');
const router = express.Router();
const annotationController = require('../controllers/annotationController');
const requireAuth = require('../middlewares/authMiddleware');

router.use(requireAuth);

router.get('/', annotationController.getAnnotations);
router.post('/', annotationController.createAnnotation);
router.put('/:id', annotationController.updateAnnotation);
router.delete('/:id', annotationController.deleteAnnotation);

module.exports = router;
