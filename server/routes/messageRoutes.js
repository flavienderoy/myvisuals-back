const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const requireAuth = require('../middlewares/authMiddleware');

router.get('/project/:projectId', requireAuth, messageController.getMessages);
router.post('/project/:projectId', requireAuth, messageController.sendMessage);
router.delete('/:id', requireAuth, messageController.deleteMessage);

module.exports = router;
