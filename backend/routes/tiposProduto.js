const express = require('express');
const router = express.Router();
const tipoProdutoController = require('../controllers/tipoProdutoController');
const { authenticate } = require('../middlewares/authenticate');
const { isAdmin } = require('../middlewares/authorize');

// Rotas admin (requerem autenticação e permissão de admin)
router.get('/', authenticate, isAdmin, tipoProdutoController.listarTipos);
router.get('/:id', authenticate, isAdmin, tipoProdutoController.obterTipo);
router.post('/', authenticate, isAdmin, tipoProdutoController.criarTipo);
router.put('/:id', authenticate, isAdmin, tipoProdutoController.atualizarTipo);

// Rotas de configuração de embalagem
router.get('/:id/embalagem', authenticate, isAdmin, tipoProdutoController.obterConfigEmbalagem);
router.put('/:id/embalagem', authenticate, isAdmin, tipoProdutoController.atualizarConfigEmbalagem);
router.post('/:id/embalagem/duplicar', authenticate, isAdmin, tipoProdutoController.duplicarConfig);

module.exports = router;
