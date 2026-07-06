const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const requireAuth = require('../middlewares/authMiddleware');

router.get('/', requireAuth, quoteController.getQuotes);
router.get('/:id', requireAuth, quoteController.getQuoteById);
router.post('/', requireAuth, quoteController.createQuote);
router.put('/:id', requireAuth, quoteController.updateQuote);
router.delete('/:id', requireAuth, quoteController.deleteQuote);

module.exports = router;
