const express = require('express');
const router = express.Router();
const {
  listarNotificacoes,
  obterNaoLidas,
  marcarLida,
  marcarTodasLidas,
  excluirNotificacao,
} = require('../controllers/notificacaoController');
const { authenticate } = require('../middlewares/authenticate');

router.use(authenticate);

router.get('/', listarNotificacoes);
router.get('/nao-lidas', obterNaoLidas);
router.post('/ler-todas', marcarTodasLidas);
router.post('/:id/ler', marcarLida);
router.delete('/:id', excluirNotificacao);

module.exports = router;
