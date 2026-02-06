const pool = require('../config/database');

// Listar todos os favoritos do usuário
const listarFavoritos = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const query = `
      SELECT 
        p.id,
        p.nome,
        p.preco,
        p.preco_promocional,
        p.imagem_principal,
        p.estoque,
        f.created_at as data_favoritado
      FROM favoritos f
      INNER JOIN produtos p ON f.produto_id = p.id
      WHERE f.usuario_id = $1
      ORDER BY f.created_at DESC
    `;

    const result = await pool.query(query, [usuarioId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar favoritos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar favoritos'
    });
  }
};

// Adicionar produto aos favoritos
const adicionarFavorito = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { produtoId } = req.body;

    if (!produtoId) {
      return res.status(400).json({
        success: false,
        error: 'ID do produto é obrigatório'
      });
    }

    // Verificar se o produto existe
    const produtoQuery = 'SELECT id FROM produtos WHERE id = $1';
    const produtoResult = await pool.query(produtoQuery, [produtoId]);

    if (produtoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado'
      });
    }

    // Verificar se já está nos favoritos
    const checkQuery = 'SELECT id FROM favoritos WHERE usuario_id = $1 AND produto_id = $2';
    const checkResult = await pool.query(checkQuery, [usuarioId, produtoId]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Produto já está nos favoritos'
      });
    }

    // Adicionar aos favoritos
    const insertQuery = `
      INSERT INTO favoritos (usuario_id, produto_id)
      VALUES ($1, $2)
      RETURNING id
    `;
    
    await pool.query(insertQuery, [usuarioId, produtoId]);

    res.status(201).json({
      success: true,
      message: 'Produto adicionado aos favoritos'
    });
  } catch (error) {
    console.error('Erro ao adicionar favorito:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao adicionar produto aos favoritos'
    });
  }
};

// Remover produto dos favoritos
const removerFavorito = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { produtoId } = req.params;

    const deleteQuery = `
      DELETE FROM favoritos
      WHERE usuario_id = $1 AND produto_id = $2
      RETURNING id
    `;

    const result = await pool.query(deleteQuery, [usuarioId, produtoId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produto não está nos favoritos'
      });
    }

    res.json({
      success: true,
      message: 'Produto removido dos favoritos'
    });
  } catch (error) {
    console.error('Erro ao remover favorito:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao remover produto dos favoritos'
    });
  }
};

// Verificar se produto está nos favoritos
const verificarFavorito = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { produtoId } = req.params;

    const query = 'SELECT id FROM favoritos WHERE usuario_id = $1 AND produto_id = $2';
    const result = await pool.query(query, [usuarioId, produtoId]);

    res.json({
      isFavorito: result.rows.length > 0
    });
  } catch (error) {
    console.error('Erro ao verificar favorito:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar favorito'
    });
  }
};

module.exports = {
  listarFavoritos,
  adicionarFavorito,
  removerFavorito,
  verificarFavorito
};
