const express = require('express');
const router = express.Router();
const {
  criarAvaliacao,
  listarAvaliacoes,
  atualizarAvaliacao,
  deletarAvaliacao,
  marcarUtil,
  adicionarComentario,
  listarComentarios,
} = require('../controllers/avaliacaoController');
const { authenticate } = require('../middlewares/authenticate');

// Rotas públicas (visualização)
router.get('/produtos/:id/avaliacoes', listarAvaliacoes);
router.get('/produtos/:id/comentarios', listarComentarios);

// Rotas que requerem autenticação
router.post('/produtos/:id/avaliacoes', authenticate, criarAvaliacao);
router.post('/produtos/:id/comentarios', authenticate, adicionarComentario);
router.put('/avaliacoes/:id', authenticate, atualizarAvaliacao);
router.delete('/avaliacoes/:id', authenticate, deletarAvaliacao);
router.post('/comentarios/:id/util', authenticate, marcarUtil);

module.exports = router;
