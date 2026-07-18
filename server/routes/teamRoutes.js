const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const requireAuth = require('../middlewares/authMiddleware');
const blockClients = require('../middlewares/blockClients');

// Team management is studio-only (defense-in-depth alongside the front guard)
router.use(requireAuth, blockClients);

router.get('/', teamController.getTeamMembers);
router.post('/invite', teamController.inviteMember);
router.put('/:id', teamController.updateMember);
router.delete('/:id', teamController.removeMember);
router.get('/my-studio', teamController.getMyStudio);

module.exports = router;
