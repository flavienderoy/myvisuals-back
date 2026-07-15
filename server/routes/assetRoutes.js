const express = require('express');
const router = express.Router();
const multer = require('multer');
const assetController = require('../controllers/assetController');
const requireAuth = require('../middlewares/authMiddleware');

// Configure multer for memory storage (files buffered before upload to Supabase)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
});

// Asset CRUD
router.get('/project/:projectId', requireAuth, assetController.getAssets);
router.get('/project/:projectId/zip', requireAuth, assetController.downloadProjectZip);
router.get('/:id/download', requireAuth, assetController.downloadAsset);
router.get('/:id', requireAuth, assetController.getAssetById);
router.post('/project/:projectId', requireAuth, upload.single('file'), assetController.createAsset);
router.put('/:id', requireAuth, assetController.updateAsset);
router.delete('/:id', requireAuth, assetController.deleteAsset);

// Annotations
router.post('/:id/annotations', requireAuth, assetController.addAnnotation);

// Versions
router.post('/:id/versions', requireAuth, upload.single('file'), assetController.uploadVersion);

module.exports = router;
