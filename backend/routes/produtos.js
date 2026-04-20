const express = require('express');
const router = express.Router();
const {
  listarProdutos,
  listarProdutosAdmin,
  obterProduto,
  listarPromocoes,
  listarDestaques,
  criarProduto,
  atualizarProduto,
  atualizarEstoque,
  deletarProduto,
} = require('../controllers/produtoController');
const {
  adicionarBadgeAoProduto,
  removerBadgeDoProduto,
  listarBadgesDoProduto,
} = require('../controllers/badgeController');
const { authenticate } = require('../middlewares/authenticate');
const { isAdmin } = require('../middlewares/authorize');
const upload = require('../middlewares/upload');

const validarIdNumerico = (req, res, next) => {
  if (!/^\d+$/.test(String(req.params.id))) {
    return res.status(404).json({
      success: false,
      error: 'Rota não encontrada',
    });
  }

  return next();
};

// Rotas públicas
router.get('/', listarProdutos);
router.get('/promocoes', listarPromocoes);
router.get('/destaques', listarDestaques);
router.get('/admin', authenticate, isAdmin, listarProdutosAdmin);

// Rota de upload de imagem
router.post('/upload-imagem', authenticate, isAdmin, upload.single('imagem'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nenhum arquivo foi enviado' 
      });
    }

    // Retornar o caminho relativo da imagem
    const imagemUrl = `/image/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      message: 'Imagem enviada com sucesso',
      data: {
        url: imagemUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao fazer upload da imagem',
      error: error.message 
    });
  }
});

router.get('/:id', validarIdNumerico, obterProduto);

// Rotas protegidas (admin)
router.post('/', authenticate, isAdmin, criarProduto);
router.put('/:id', authenticate, isAdmin, validarIdNumerico, atualizarProduto);
router.patch('/:id/estoque', authenticate, isAdmin, validarIdNumerico, atualizarEstoque);
router.delete('/:id', authenticate, isAdmin, validarIdNumerico, deletarProduto);

// Rotas de badges do produto
router.get('/:id/badges', validarIdNumerico, listarBadgesDoProduto);
router.post('/:id/badges', authenticate, isAdmin, validarIdNumerico, adicionarBadgeAoProduto);
router.delete('/:id/badges/:badgeId', authenticate, isAdmin, validarIdNumerico, removerBadgeDoProduto);

module.exports = router;
