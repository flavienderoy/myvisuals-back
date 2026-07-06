const express = require('express');
const router = express.Router();
const timeEntryController = require('../controllers/timeEntryController');
const requireAuth = require('../middlewares/authMiddleware');

router.get('/', requireAuth, timeEntryController.getTimeEntries);
router.post('/', requireAuth, timeEntryController.createTimeEntry);
router.put('/:id', requireAuth, timeEntryController.updateTimeEntry);
router.delete('/:id', requireAuth, timeEntryController.deleteTimeEntry);

module.exports = router;
