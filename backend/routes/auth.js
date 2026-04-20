const express = require('express');
const router = express.Router();
const {
  registrar,
  login,
  obterPerfil,
  atualizarPerfil,
  solicitarCodigoAlteracaoCpf,
  confirmarAlteracaoCpf,
  alterarSenha,
  solicitarRecuperacaoSenha,
  redefinirSenha,
} = require('../controllers/authController');
const { authenticate } = require('../middlewares/authenticate');
const { loginLimiter, recoveryLimiter } = require('../middlewares/rateLimit');

// Rotas públicas
router.post('/registro', registrar);
router.post('/login', loginLimiter, login);
router.post('/recuperar-senha', recoveryLimiter, solicitarRecuperacaoSenha);
router.post('/redefinir-senha', redefinirSenha);

// Rotas protegidas (requer autenticação)
router.get('/perfil', authenticate, obterPerfil);
router.put('/perfil', authenticate, atualizarPerfil);
router.post('/perfil/cpf/codigo', authenticate, recoveryLimiter, solicitarCodigoAlteracaoCpf);
router.post('/perfil/cpf/confirmar', authenticate, confirmarAlteracaoCpf);
router.put('/senha', authenticate, alterarSenha);

module.exports = router;
