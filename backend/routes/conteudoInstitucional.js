const express = require('express');
const router = express.Router();
const {
  listarConteudosPublicos,
  obterConteudoPublico,
} = require('../controllers/conteudoInstitucionalController');

router.get('/', listarConteudosPublicos);
router.get('/:slug', obterConteudoPublico);

module.exports = router;
