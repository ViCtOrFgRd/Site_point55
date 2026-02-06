const express = require('express');
const router = express.Router();
const favoritoController = require('../controllers/favoritoController');
const { authenticate } = require('../middlewares/authenticate');

// Todas as rotas de favoritos requerem autenticação
router.use(authenticate);

// GET /api/favoritos - Listar favoritos do usuário
router.get('/', favoritoController.listarFavoritos);

// POST /api/favoritos - Adicionar produto aos favoritos
router.post('/', favoritoController.adicionarFavorito);

// DELETE /api/favoritos/:produtoId - Remover produto dos favoritos
router.delete('/:produtoId', favoritoController.removerFavorito);

// GET /api/favoritos/verificar/:produtoId - Verificar se produto está nos favoritos
router.get('/verificar/:produtoId', favoritoController.verificarFavorito);

module.exports = router;
