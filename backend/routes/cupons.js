const express = require('express');
const router = express.Router();
const {
  validarCupom,
  listarCupons,
  criarCupom,
  atualizarCupom,
  deletarCupom,
} = require('../controllers/cupomController');
const { authenticate } = require('../middlewares/authenticate');
const { isAdmin } = require('../middlewares/authorize');

// Rota pública para validar cupom
router.post('/validar', validarCupom);

// Rotas protegidas (admin)
router.get('/', authenticate, isAdmin, listarCupons);
router.post('/', authenticate, isAdmin, criarCupom);
router.put('/:id', authenticate, isAdmin, atualizarCupom);
router.delete('/:id', authenticate, isAdmin, deletarCupom);

module.exports = router;
