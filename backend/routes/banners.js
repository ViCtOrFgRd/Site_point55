const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { authenticate } = require('../middlewares/authenticate');
const { isAdmin } = require('../middlewares/authorize');

// Rotas públicas
router.get('/', bannerController.listarBanners);
router.get('/:id', bannerController.obterBanner);

// Rotas admin (requerem autenticação e permissão de admin)
router.post('/', authenticate, isAdmin, bannerController.criarBanner);
router.put('/:id', authenticate, isAdmin, bannerController.atualizarBanner);
router.patch('/:id/toggle', authenticate, isAdmin, bannerController.alternarStatusBanner);
router.patch('/reordenar', authenticate, isAdmin, bannerController.reordenarBanners);
router.delete('/:id', authenticate, isAdmin, bannerController.deletarBanner);

module.exports = router;
