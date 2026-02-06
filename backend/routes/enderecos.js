const express = require('express');
const router = express.Router();
const {
  adicionarEndereco,
  listarEnderecos,
  obterEndereco,
  atualizarEndereco,
  deletarEndereco,
  tornarPrincipal,
} = require('../controllers/enderecoController');
const { authenticate } = require('../middlewares/authenticate');

// Todas as rotas requerem autenticação
router.use(authenticate);

router.post('/', adicionarEndereco);
router.get('/', listarEnderecos);
router.get('/:id', obterEndereco);
router.put('/:id', atualizarEndereco);
router.delete('/:id', deletarEndereco);
router.patch('/:id/principal', tornarPrincipal);

module.exports = router;
