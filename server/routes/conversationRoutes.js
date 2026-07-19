const express = require('express');
const router = express.Router();
const c = require('../controllers/conversationController');
const requireAuth = require('../middlewares/authMiddleware');

router.use(requireAuth);

router.get('/', c.getConversations);
router.get('/contacts', c.getContacts);
router.post('/', c.createConversation);
router.post('/direct', c.directConversation);
router.get('/:id/messages', c.getMessages);
router.post('/:id/messages', c.sendMessage);
router.post('/:id/read', c.markRead);
router.patch('/:id', c.updateConversation);

module.exports = router;
