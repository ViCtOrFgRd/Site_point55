const express = require('express');
const router = express.Router();
const {
  listarBadges,
  obterBadge,
  criarBadge,
  atualizarBadge,
  deletarBadge,
  adicionarBadgeAoProduto,
  removerBadgeDoProduto,
  listarBadgesDoProduto,
} = require('../controllers/badgeController');
const { authenticate } = require('../middlewares/authenticate');
const { isAdmin } = require('../middlewares/authorize');

// Rotas públicas
router.get('/', listarBadges);
router.get('/:id', obterBadge);

// Rotas admin
router.post('/', authenticate, isAdmin, criarBadge);
router.put('/:id', authenticate, isAdmin, atualizarBadge);
router.delete('/:id', authenticate, isAdmin, deletarBadge);

// Rotas de relacionamento produto-badge
router.get('/produtos/:id/badges', listarBadgesDoProduto);
router.post('/produtos/:id/badges', authenticate, isAdmin, adicionarBadgeAoProduto);
router.delete('/produtos/:id/badges/:badgeId', authenticate, isAdmin, removerBadgeDoProduto);

module.exports = router;
