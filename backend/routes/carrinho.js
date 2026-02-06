const express = require('express');
const router = express.Router();
const {
  obterCarrinho,
  adicionarAoCarrinho,
  atualizarItem,
  removerItem,
  limparCarrinho,
  sincronizarCarrinho,
} = require('../controllers/carrinhoController');
const { authenticate } = require('../middlewares/authenticate');

// Todas as rotas requerem autenticação
router.get('/', authenticate, obterCarrinho);
router.post('/', authenticate, adicionarAoCarrinho);
router.post('/sincronizar', authenticate, sincronizarCarrinho);
router.put('/:id', authenticate, atualizarItem);
router.delete('/:id', authenticate, removerItem);
router.delete('/', authenticate, limparCarrinho);

module.exports = router;
