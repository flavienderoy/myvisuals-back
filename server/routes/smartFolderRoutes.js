const express = require('express');
const router = express.Router();
const smartFolderController = require('../controllers/smartFolderController');
const requireAuth = require('../middlewares/authMiddleware');

router.get('/', requireAuth, smartFolderController.getSmartFolders);
router.post('/', requireAuth, smartFolderController.createSmartFolder);
router.put('/:id', requireAuth, smartFolderController.updateSmartFolder);
router.delete('/:id', requireAuth, smartFolderController.deleteSmartFolder);

module.exports = router;
