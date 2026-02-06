const express = require('express');
const router = express.Router();
const {
  registrar,
  login,
  obterPerfil,
  atualizarPerfil,
  alterarSenha,
  solicitarRecuperacaoSenha,
  redefinirSenha,
} = require('../controllers/authController');
const { authenticate } = require('../middlewares/authenticate');

// Rotas públicas
router.post('/registro', registrar);
router.post('/login', login);
router.post('/recuperar-senha', solicitarRecuperacaoSenha);
router.post('/redefinir-senha', redefinirSenha);

// Rotas protegidas (requer autenticação)
router.get('/perfil', authenticate, obterPerfil);
router.put('/perfil', authenticate, atualizarPerfil);
router.put('/senha', authenticate, alterarSenha);

module.exports = router;
