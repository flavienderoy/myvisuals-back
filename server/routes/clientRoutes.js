const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const requireAuth = require('../middlewares/authMiddleware');

router.get('/', requireAuth, clientController.getClients);
router.get('/:id', requireAuth, clientController.getClientById);
router.post('/', requireAuth, clientController.createClient);
router.put('/:id', requireAuth, clientController.updateClient);
router.delete('/:id', requireAuth, clientController.deleteClient);

module.exports = router;
