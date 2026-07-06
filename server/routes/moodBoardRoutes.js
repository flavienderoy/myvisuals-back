const express = require('express');
const router = express.Router();
const moodBoardController = require('../controllers/moodBoardController');
const requireAuth = require('../middlewares/authMiddleware');

router.get('/', requireAuth, moodBoardController.getMoodBoards);
router.get('/:id', requireAuth, moodBoardController.getMoodBoardById);
router.post('/', requireAuth, moodBoardController.createMoodBoard);
router.put('/:id', requireAuth, moodBoardController.updateMoodBoard);
router.delete('/:id', requireAuth, moodBoardController.deleteMoodBoard);

// Manage assets in mood board
router.post('/:id/assets', requireAuth, moodBoardController.addAsset);
router.delete('/:id/assets/:assetId', requireAuth, moodBoardController.removeAsset);

module.exports = router;
