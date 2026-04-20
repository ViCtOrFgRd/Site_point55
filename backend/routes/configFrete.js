const express = require('express');
const router = express.Router();
const configFreteController = require('../controllers/configFreteController');
const { authenticate } = require('../middlewares/authenticate');
const { isAdmin } = require('../middlewares/authorize');

// Rotas admin (requerem autenticação e permissão de admin)
router.get('/fallback', authenticate, isAdmin, configFreteController.obterConfigFallback);
router.put('/fallback', authenticate, isAdmin, configFreteController.atualizarConfigFallback);

module.exports = router;
