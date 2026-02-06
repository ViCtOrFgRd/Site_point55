const { pool } = require('../config/database');

// GET /api/badges - Listar todos os badges
const listarBadges = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM badges ORDER BY nome ASC'
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar badges:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar badges',
    });
  }
};

// GET /api/badges/:id - Obter badge específico
const obterBadge = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM badges WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Badge não encontrado',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao obter badge:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar badge',
    });
  }
};

// POST /api/badges - Criar novo badge (admin)
const criarBadge = async (req, res) => {
  try {
    const { nome, tipo, cor, icone, ativo } = req.body;

    // Validação
    if (!nome || !tipo) {
      return res.status(400).json({
        success: false,
        error: 'Nome e tipo são obrigatórios',
      });
    }

    const tiposPermitidos = ['best_seller', 'mais_vendido', 'novo', 'limitado'];
    if (!tiposPermitidos.includes(tipo)) {
      return res.status(400).json({
        success: false,
        error: `Tipo deve ser um de: ${tiposPermitidos.join(', ')}`,
      });
    }

    const result = await pool.query(
      `INSERT INTO badges (nome, tipo, cor, icone, ativo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nome, tipo, cor || '#000000', icone, ativo !== undefined ? ativo : true]
    );

    res.status(201).json({
      success: true,
      message: 'Badge criado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao criar badge:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar badge',
    });
  }
};

// PUT /api/badges/:id - Atualizar badge (admin)
const atualizarBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, tipo, cor, icone, ativo } = req.body;

    // Verificar se badge existe
    const badgeExiste = await pool.query(
      'SELECT id FROM badges WHERE id = $1',
      [id]
    );

    if (badgeExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Badge não encontrado',
      });
    }

    const result = await pool.query(
      `UPDATE badges
       SET nome = CASE WHEN $1::text IS NOT NULL THEN $1 ELSE nome END,
           tipo = CASE WHEN $2::text IS NOT NULL THEN $2 ELSE tipo END,
           cor = CASE WHEN $3::text IS NOT NULL THEN $3 ELSE cor END,
           icone = CASE WHEN $4::text IS NOT NULL THEN $4 ELSE icone END,
           ativo = CASE WHEN $5::boolean IS NOT NULL THEN $5 ELSE ativo END
       WHERE id = $6
       RETURNING *`,
      [
        nome || null,
        tipo || null,
        cor || null,
        icone || null,
        ativo !== undefined ? ativo : null,
        id
      ]
    );

    res.json({
      success: true,
      message: 'Badge atualizado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar badge:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar badge',
    });
  }
};

// DELETE /api/badges/:id - Deletar badge (admin)
const deletarBadge = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se badge existe
    const badgeExiste = await pool.query(
      'SELECT id FROM badges WHERE id = $1',
      [id]
    );

    if (badgeExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Badge não encontrado',
      });
    }

    // Remover relacionamentos primeiro
    await pool.query('DELETE FROM produtos_badges WHERE badge_id = $1', [id]);

    // Deletar badge
    await pool.query('DELETE FROM badges WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Badge deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar badge:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar badge',
    });
  }
};

// POST /api/produtos/:id/badges - Adicionar badge ao produto (admin)
const adicionarBadgeAoProduto = async (req, res) => {
  try {
    const { id: produtoId } = req.params;
    const { badge_id } = req.body;

    if (!badge_id) {
      return res.status(400).json({
        success: false,
        error: 'ID do badge é obrigatório',
      });
    }

    // Verificar se produto existe
    const produtoExiste = await pool.query(
      'SELECT id FROM produtos WHERE id = $1',
      [produtoId]
    );

    if (produtoExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
      });
    }

    // Verificar se badge existe
    const badgeExiste = await pool.query(
      'SELECT id FROM badges WHERE id = $1',
      [badge_id]
    );

    if (badgeExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Badge não encontrado',
      });
    }

    // Verificar se já existe
    const relacionamentoExiste = await pool.query(
      'SELECT * FROM produtos_badges WHERE produto_id = $1 AND badge_id = $2',
      [produtoId, badge_id]
    );

    if (relacionamentoExiste.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Badge já está associado a este produto',
      });
    }

    // Adicionar relacionamento
    await pool.query(
      'INSERT INTO produtos_badges (produto_id, badge_id) VALUES ($1, $2)',
      [produtoId, badge_id]
    );

    res.status(201).json({
      success: true,
      message: 'Badge adicionado ao produto com sucesso',
    });
  } catch (error) {
    console.error('Erro ao adicionar badge ao produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao adicionar badge',
    });
  }
};

// DELETE /api/produtos/:id/badges/:badgeId - Remover badge do produto (admin)
const removerBadgeDoProduto = async (req, res) => {
  try {
    const { id: produtoId, badgeId } = req.params;

    const result = await pool.query(
      'DELETE FROM produtos_badges WHERE produto_id = $1 AND badge_id = $2 RETURNING *',
      [produtoId, badgeId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Relacionamento não encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Badge removido do produto com sucesso',
    });
  } catch (error) {
    console.error('Erro ao remover badge do produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao remover badge',
    });
  }
};

// GET /api/produtos/:id/badges - Listar badges de um produto
const listarBadgesDoProduto = async (req, res) => {
  try {
    const { id: produtoId } = req.params;

    const result = await pool.query(
      `SELECT b.*
       FROM badges b
       INNER JOIN produtos_badges pb ON b.id = pb.badge_id
       WHERE pb.produto_id = $1
       ORDER BY b.nome ASC`,
      [produtoId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar badges do produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar badges',
    });
  }
};

module.exports = {
  listarBadges,
  obterBadge,
  criarBadge,
  atualizarBadge,
  deletarBadge,
  adicionarBadgeAoProduto,
  removerBadgeDoProduto,
  listarBadgesDoProduto,
};
