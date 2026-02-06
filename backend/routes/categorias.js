const express = require('express');
const router = express.Router();
const {
  listarCategorias,
  obterCategoria,
  listarProdutosPorCategoria,
  criarCategoria,
  atualizarCategoria,
  deletarCategoria,
} = require('../controllers/categoriaController');
const { authenticate } = require('../middlewares/authenticate');
const { isAdmin } = require('../middlewares/authorize');

// Rotas públicas
router.get('/', listarCategorias);
router.get('/:id', obterCategoria);
router.get('/:id/produtos', listarProdutosPorCategoria);

// Rotas protegidas (admin)
router.post('/', authenticate, isAdmin, criarCategoria);
router.put('/:id', authenticate, isAdmin, atualizarCategoria);
router.delete('/:id', authenticate, isAdmin, deletarCategoria);

module.exports = router;
