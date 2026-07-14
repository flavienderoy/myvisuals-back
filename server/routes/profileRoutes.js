const express = require('express');
const router = express.Router();
const multer = require('multer');
const profileController = require('../controllers/profileController');
const requireAuth = require('../middlewares/authMiddleware');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max for avatars
});

router.get('/', requireAuth, profileController.getProfile);
router.put('/', requireAuth, profileController.updateProfile);
router.post('/avatar', requireAuth, upload.single('avatar'), profileController.uploadAvatar);

// RGPD — Right to erasure: permanently delete the authenticated user's account
router.delete('/account', requireAuth, profileController.deleteAccount);

module.exports = router;
