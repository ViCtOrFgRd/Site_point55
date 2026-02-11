const { pool } = require('../config/database');

// GET /api/categorias/admin - Listar todas as categorias (admin)
const listarCategoriasAdmin = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, 
        COUNT(DISTINCT p.id) FILTER (WHERE p.ativo = true AND p.estoque > 0 AND p.preco > 0) as produtos_count
      FROM categorias c
      LEFT JOIN produto_categorias pc ON pc.categoria_id = c.id
      LEFT JOIN produtos p ON p.id = pc.produto_id
      GROUP BY c.id
      ORDER BY c.ordem ASC, c.nome ASC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar categorias (admin):', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar categorias',
    });
  }
};

// GET /api/categorias - Listar todas as categorias ativas
const listarCategorias = async (req, res) => {
  try {
    // Incluir contagem de produtos por categoria via produto_categorias
    const result = await pool.query(`
      SELECT c.*, 
        COUNT(DISTINCT p.id) FILTER (WHERE p.ativo = true AND p.estoque > 0 AND p.preco > 0) as produtos_count
      FROM categorias c
      LEFT JOIN produto_categorias pc ON pc.categoria_id = c.id
      LEFT JOIN produtos p ON p.id = pc.produto_id
      WHERE c.ativa = true
      GROUP BY c.id
      ORDER BY c.ordem ASC, c.nome ASC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar categorias',
    });
  }
};

// GET /api/categorias/:id - Obter categoria específica
const obterCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM categorias WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Categoria não encontrada',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao obter categoria:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar categoria',
    });
  }
};

// GET /api/categorias/:id/produtos - Listar produtos por categoria
const listarProdutosPorCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { limite = 20, pagina = 1, ordem = 'data_criacao', direcao = 'DESC' } = req.query;

    const offset = (pagina - 1) * limite;

    // Verificar se categoria existe
    const categoriaResult = await pool.query(
      'SELECT id FROM categorias WHERE id = $1 AND ativa = true',
      [id]
    );

    if (categoriaResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Categoria não encontrada',
      });
    }

    const ordensPermitidas = {
      data_criacao: 'p.data_criacao',
      preco: 'p.preco',
      nome: 'p.nome',
      vendas: 'p.vendas_total',
    };
    const ordenacao = ordensPermitidas[ordem] || 'p.data_criacao';
    const direcaoOrdem = String(direcao).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Buscar produtos da categoria
    const produtosResult = await pool.query(
      `SELECT p.*, c.nome as categoria_nome, c.slug as categoria_slug
       FROM produtos p
       JOIN produto_categorias pc ON p.id = pc.produto_id
       JOIN categorias c ON pc.categoria_id = c.id
      WHERE pc.categoria_id = $1 AND p.ativo = true AND p.estoque > 0 AND p.preco > 0
       ORDER BY ${ordenacao} ${direcaoOrdem}
       LIMIT $2 OFFSET $3`,
      [id, limite, offset]
    );

    // Contar total de produtos
    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT p.id)
       FROM produtos p
       JOIN produto_categorias pc ON p.id = pc.produto_id
       WHERE pc.categoria_id = $1 AND p.ativo = true AND p.estoque > 0 AND p.preco > 0`,
      [id]
    );

    res.json({
      success: true,
      count: produtosResult.rows.length,
      total: parseInt(countResult.rows[0].count),
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(countResult.rows[0].count / limite),
      data: produtosResult.rows,
    });
  } catch (error) {
    console.error('Erro ao listar produtos por categoria:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar produtos',
    });
  }
};

// POST /api/categorias - Criar nova categoria (admin)
const criarCategoria = async (req, res) => {
  try {
    const { nome, slug, imagem, ordem, ativa = true } = req.body;

    // Validação básica
    if (!nome || !slug) {
      return res.status(400).json({
        success: false,
        error: 'Nome e slug são obrigatórios',
      });
    }

    // Verificar se slug já existe
    const slugExiste = await pool.query(
      'SELECT id FROM categorias WHERE slug = $1',
      [slug]
    );

    if (slugExiste.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Slug já está em uso',
      });
    }

    const result = await pool.query(
      `INSERT INTO categorias (nome, slug, imagem, ordem, ativa)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nome, slug, imagem, ordem || 0, ativa]
    );

    res.status(201).json({
      success: true,
      message: 'Categoria criada com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar categoria',
    });
  }
};

// PUT /api/categorias/:id - Atualizar categoria (admin)
const atualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, slug, imagem, ordem, ativa } = req.body;

    // Verificar se categoria existe
    const categoriaExiste = await pool.query(
      'SELECT id FROM categorias WHERE id = $1',
      [id]
    );

    if (categoriaExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Categoria não encontrada',
      });
    }

    // Se slug foi alterado, verificar se não está em uso
    if (slug) {
      const slugExiste = await pool.query(
        'SELECT id FROM categorias WHERE slug = $1 AND id != $2',
        [slug, id]
      );

      if (slugExiste.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Slug já está em uso',
        });
      }
    }

    const result = await pool.query(
      `UPDATE categorias
       SET nome = COALESCE($1, nome),
           slug = COALESCE($2, slug),
           imagem = COALESCE($3, imagem),
           ordem = COALESCE($4, ordem),
           ativa = COALESCE($5, ativa)
       WHERE id = $6
       RETURNING *`,
      [nome, slug, imagem, ordem, ativa, id]
    );

    res.json({
      success: true,
      message: 'Categoria atualizada com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar categoria',
    });
  }
};

// DELETE /api/categorias/:id - Deletar categoria (admin)
const deletarCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se categoria existe
    const categoriaExiste = await pool.query(
      'SELECT id FROM categorias WHERE id = $1',
      [id]
    );

    if (categoriaExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Categoria não encontrada',
      });
    }

    // Verificar se há produtos vinculados
    const produtosVinculados = await pool.query(
      'SELECT COUNT(*) FROM produto_categorias WHERE categoria_id = $1',
      [id]
    );

    if (parseInt(produtosVinculados.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível deletar categoria com produtos vinculados',
      });
    }

    await pool.query('DELETE FROM categorias WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Categoria deletada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar categoria',
    });
  }
};

module.exports = {
  listarCategorias,
  listarCategoriasAdmin,
  obterCategoria,
  listarProdutosPorCategoria,
  criarCategoria,
  atualizarCategoria,
  deletarCategoria,
};
