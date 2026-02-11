const express = require('express');
const router = express.Router();
const {
  listarPromocoes,
  listarPromocoesVigentes,
  obterPromocao,
  criarPromocao,
  atualizarPromocao,
  deletarPromocao,
  togglePromocao,
  verificarPromocoesAplicaveis,
} = require('../controllers/promocaoController');
const { authenticate } = require('../middlewares/authenticate');
const { isAdmin } = require('../middlewares/authorize');

// Rotas públicas
router.get('/', listarPromocoes);
router.get('/vigentes', listarPromocoesVigentes);
router.get('/produtos/:id', verificarPromocoesAplicaveis);
router.get('/:id', obterPromocao);

// Rotas admin
router.post('/', authenticate, isAdmin, criarPromocao);
router.put('/:id', authenticate, isAdmin, atualizarPromocao);
router.delete('/:id', authenticate, isAdmin, deletarPromocao);
router.patch('/:id/ativar', authenticate, isAdmin, togglePromocao);

module.exports = router;
