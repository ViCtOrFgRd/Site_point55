const express = require('express');
const router = express.Router();
const {
  listarCategorias,
  obterCategoria,
  listarProdutosPorCategoria,
  criarCategoria,
  atualizarCategoria,
  deletarCategoria,
} = require('../controllers/categoriaController');
const { authenticate } = require('../middlewares/authenticate');
const { isAdmin } = require('../middlewares/authorize');
const upload = require('../middlewares/upload');

// Rotas públicas
router.get('/', listarCategorias);
router.get('/:id', obterCategoria);
router.get('/:id/produtos', listarProdutosPorCategoria);

// Rota de upload de imagem
router.post('/upload-imagem', authenticate, isAdmin, upload.single('imagem'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado',
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
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer upload da imagem',
      error: error.message,
    });
  }
});

// Rotas protegidas (admin)
router.post('/', authenticate, isAdmin, criarCategoria);
router.put('/:id', authenticate, isAdmin, atualizarCategoria);
router.delete('/:id', authenticate, isAdmin, deletarCategoria);

module.exports = router;
