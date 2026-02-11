const express = require('express');
const router = express.Router();
const {
  criarDevolucao,
  listarDevolucoes,
  obterDevolucao,
  atualizarStatus,
  recorrerDevolucao,
} = require('../controllers/devolucaoController');
const { authenticate } = require('../middlewares/authenticate');
const { isAdmin } = require('../middlewares/authorize');
const upload = require('../middlewares/upload');

router.use(authenticate);

router.post('/', upload.array('anexos', 5), criarDevolucao);
router.get('/', listarDevolucoes);
router.get('/:id', obterDevolucao);
router.post('/:id/recorrer', recorrerDevolucao);

router.patch('/:id/status', authenticate, isAdmin, atualizarStatus);

module.exports = router;
