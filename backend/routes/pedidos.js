const express = require('express');
const router = express.Router();
const {
  criarPedido,
  listarPedidos,
  obterPedido,
  obterRastreamento,
  atualizarStatus,
  adicionarRastreio,
  cancelarPedido,
} = require('../controllers/pedidoController');
const { authenticate } = require('../middlewares/authenticate');
const { isAdmin } = require('../middlewares/authorize');

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas do usuário
router.post('/', criarPedido);
router.get('/', listarPedidos);
router.get('/:id', obterPedido);
router.get('/:id/rastreamento', obterRastreamento);
router.post('/:id/cancelar', cancelarPedido);

// Rotas admin
router.put('/:id/status', authenticate, isAdmin, atualizarStatus);
router.put('/:id/rastreio', authenticate, isAdmin, adicionarRastreio);

module.exports = router;
