const express = require('express');
const router = express.Router();
const { calcularFrete, obterPacotes } = require('../controllers/superfreteController');
const { authenticate } = require('../middlewares/authenticate');

router.post('/calcular', authenticate, calcularFrete);
router.get('/pacotes', authenticate, obterPacotes);

module.exports = router;
