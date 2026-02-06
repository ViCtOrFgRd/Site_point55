const express = require('express');
const router = express.Router();
const {
  inscreverNewsletter,
  cancelarInscricao,
  listarInscritos,
} = require('../controllers/newsletterController');
const { authenticate } = require('../middlewares/authenticate');
const { isAdmin } = require('../middlewares/authorize');

// Rotas públicas
router.post('/', inscreverNewsletter);
router.post('/cancelar', cancelarInscricao);
router.delete('/cancelar', cancelarInscricao);

// Rotas protegidas (admin)
router.get('/', authenticate, isAdmin, listarInscritos);

module.exports = router;
