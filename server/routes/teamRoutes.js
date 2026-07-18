const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const requireAuth = require('../middlewares/authMiddleware');

router.get('/', requireAuth, teamController.getTeamMembers);
router.post('/invite', requireAuth, teamController.inviteMember);
router.put('/:id', requireAuth, teamController.updateMember);
router.delete('/:id', requireAuth, teamController.removeMember);
router.get('/my-studio', requireAuth, teamController.getMyStudio);

module.exports = router;
