const express = require('express');
const router = express.Router();
const { calcularFrete } = require('../controllers/superfreteController');
const { authenticate } = require('../middlewares/authenticate');

router.post('/calcular', authenticate, calcularFrete);

module.exports = router;
