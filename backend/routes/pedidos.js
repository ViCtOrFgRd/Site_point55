const express = require('express');
const router = express.Router();
const {
  criarPedido,
  listarPedidos,
  obterPedido,
  atualizarPixQrCode,
  obterRastreamento,
  confirmarRetirada,
  listarRetiradasAdmin,
  obterHistoricoRetirada,
  atualizarStatus,
  adicionarRastreio,
  cancelarPedido,
  listarReembolsosAdmin,
  processarReembolsoAdmin,
  criarEtiqueta,
  pagarEtiqueta,
  obterEtiqueta,
  imprimirEtiqueta,
  cancelarEtiqueta,
} = require('../controllers/pedidoController');
const { authenticate } = require('../middlewares/authenticate');
const { isAdmin } = require('../middlewares/authorize');

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas admin - retirada local
router.get('/admin/retiradas', authenticate, isAdmin, listarRetiradasAdmin);
router.get('/admin/retiradas/:id/historico', authenticate, isAdmin, obterHistoricoRetirada);
router.get('/admin/reembolsos', authenticate, isAdmin, listarReembolsosAdmin);

// Rotas do usuário
router.post('/', criarPedido);
router.get('/', listarPedidos);
router.get('/:id', obterPedido);
router.post('/:id/pix/refresh', atualizarPixQrCode);
router.get('/:id/rastreamento', obterRastreamento);
router.post('/:id/cancelar', cancelarPedido);
router.post('/:id/reembolso', authenticate, isAdmin, processarReembolsoAdmin);
router.post('/:id/confirmar-retirada', authenticate, isAdmin, confirmarRetirada);
router.post('/:id/etiqueta', authenticate, isAdmin, criarEtiqueta);
router.post('/:id/etiqueta/pagar', authenticate, isAdmin, pagarEtiqueta);
router.get('/:id/etiqueta', authenticate, isAdmin, obterEtiqueta);
router.post('/:id/etiqueta/print', authenticate, isAdmin, imprimirEtiqueta);
router.post('/:id/etiqueta/cancelar', authenticate, isAdmin, cancelarEtiqueta);

// Rotas admin
router.put('/:id/status', authenticate, isAdmin, atualizarStatus);
router.put('/:id/rastreio', authenticate, isAdmin, adicionarRastreio);

module.exports = router;
