const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const requireAuth = require('../middlewares/authMiddleware');

router.get('/', requireAuth, taskController.getTasks);
router.post('/', requireAuth, taskController.createTask);
router.put('/:id', requireAuth, taskController.updateTask);
router.delete('/:id', requireAuth, taskController.deleteTask);

module.exports = router;
