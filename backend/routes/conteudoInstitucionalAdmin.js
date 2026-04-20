const express = require('express');
const router = express.Router();
const {
  listarConteudosAdmin,
  obterConteudoAdmin,
  salvarConteudoAdmin,
} = require('../controllers/conteudoInstitucionalController');
const { authenticate } = require('../middlewares/authenticate');
const { isAdmin } = require('../middlewares/authorize');

router.get('/', authenticate, isAdmin, listarConteudosAdmin);
router.get('/:slug', authenticate, isAdmin, obterConteudoAdmin);
router.put('/:slug', authenticate, isAdmin, salvarConteudoAdmin);

module.exports = router;
