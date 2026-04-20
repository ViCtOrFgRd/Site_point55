const express = require('express');
const router = express.Router();
const caixaController = require('../controllers/caixaController');
const { authenticate } = require('../middlewares/authenticate');
const { isAdmin } = require('../middlewares/authorize');

// Rotas admin (requerem autenticação e permissão de admin)
router.get('/', authenticate, isAdmin, caixaController.listarCaixas);
router.get('/:id', authenticate, isAdmin, caixaController.obterCaixa);
router.get('/:id/uso', authenticate, isAdmin, caixaController.verificarUso);
router.post('/', authenticate, isAdmin, caixaController.criarCaixa);
router.put('/:id', authenticate, isAdmin, caixaController.atualizarCaixa);
router.patch('/:id/desativar', authenticate, isAdmin, caixaController.desativarCaixa);

module.exports = router;
