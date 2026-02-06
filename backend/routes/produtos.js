const express = require('express');
const router = express.Router();
const {
  listarProdutos,
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

// Rotas públicas
router.get('/', listarProdutos);
router.get('/promocoes', listarPromocoes);
router.get('/destaques', listarDestaques);
router.get('/:id', obterProduto);

// Rotas protegidas (admin)
router.post('/', authenticate, isAdmin, criarProduto);
router.put('/:id', authenticate, isAdmin, atualizarProduto);
router.patch('/:id/estoque', authenticate, isAdmin, atualizarEstoque);
router.delete('/:id', authenticate, isAdmin, deletarProduto);

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

// Rotas de badges do produto
router.get('/:id/badges', listarBadgesDoProduto);
router.post('/:id/badges', authenticate, isAdmin, adicionarBadgeAoProduto);
router.delete('/:id/badges/:badgeId', authenticate, isAdmin, removerBadgeDoProduto);

module.exports = router;
