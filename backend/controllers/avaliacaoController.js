const { pool } = require('../config/database');

// POST /api/produtos/:id/avaliacoes - Criar avaliação
const criarAvaliacao = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { id: produtoId } = req.params;
    const { nota, texto } = req.body;

    // Validação
    if (!nota || nota < 1 || nota > 5) {
      return res.status(400).json({
        success: false,
        error: 'Nota deve estar entre 1 e 5',
      });
    }

    // Verificar se produto existe
    const produtoExiste = await pool.query(
      'SELECT id FROM produtos WHERE id = $1 AND ativo = true',
      [produtoId]
    );

    if (produtoExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
      });
    }

    // Verificar se usuário comprou o produto
    const comprouProduto = await pool.query(
      `SELECT COUNT(*) as compras
       FROM itens_pedido ip
       JOIN pedidos p ON ip.pedido_id = p.id
       WHERE p.usuario_id = $1 
       AND ip.produto_id = $2 
       AND p.status IN ('entregue', 'pago')`,
      [userId, produtoId]
    );

    const verificadoCompra = parseInt(comprouProduto.rows[0].compras) > 0;

    // Verificar se já avaliou
    const jaAvaliou = await pool.query(
      'SELECT id FROM avaliacoes WHERE usuario_id = $1 AND produto_id = $2',
      [userId, produtoId]
    );

    if (jaAvaliou.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Você já avaliou este produto',
      });
    }

    // Criar avaliação
    const result = await pool.query(
      `INSERT INTO avaliacoes (produto_id, usuario_id, nota, verificado_compra)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [produtoId, userId, nota, verificadoCompra]
    );

    const avaliacaoId = result.rows[0].id;

    // Criar comentário se fornecido
    if (texto) {
      await pool.query(
        `INSERT INTO comentarios (produto_id, usuario_id, texto, verificado_compra)
         VALUES ($1, $2, $3, $4)`,
        [produtoId, userId, texto, verificadoCompra]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Avaliação criada com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar avaliação',
    });
  }
};

// GET /api/produtos/:id/avaliacoes - Listar avaliações
const listarAvaliacoes = async (req, res) => {
  try {
    const { id: produtoId } = req.params;
    const { ordem = 'recente', limite = 10, pagina = 1 } = req.query;
    const offset = (pagina - 1) * limite;

    let ordenacao = 'a.data_avaliacao DESC';
    if (ordem === 'maior_nota') {
      ordenacao = 'a.nota DESC, a.data_avaliacao DESC';
    } else if (ordem === 'menor_nota') {
      ordenacao = 'a.nota ASC, a.data_avaliacao DESC';
    }

    const result = await pool.query(
      `SELECT 
         a.id, a.nota, a.data_avaliacao, a.verificado_compra,
         u.nome as usuario_nome,
         c.texto as comentario,
         c.curtidas,
         c.data_comentario
       FROM avaliacoes a
       JOIN usuarios u ON a.usuario_id = u.id
       LEFT JOIN comentarios c ON c.produto_id = a.produto_id AND c.usuario_id = a.usuario_id
       WHERE a.produto_id = $1 AND a.ativo = true
       ORDER BY ${ordenacao}
       LIMIT $2 OFFSET $3`,
      [produtoId, limite, offset]
    );

    // Contar total e média
    const statsResult = await pool.query(
      `SELECT 
         COUNT(*) as total,
         AVG(nota) as media,
         COUNT(CASE WHEN nota = 5 THEN 1 END) as estrelas_5,
         COUNT(CASE WHEN nota = 4 THEN 1 END) as estrelas_4,
         COUNT(CASE WHEN nota = 3 THEN 1 END) as estrelas_3,
         COUNT(CASE WHEN nota = 2 THEN 1 END) as estrelas_2,
         COUNT(CASE WHEN nota = 1 THEN 1 END) as estrelas_1
       FROM avaliacoes
       WHERE produto_id = $1 AND ativo = true`,
      [produtoId]
    );

    const stats = statsResult.rows[0];

    res.json({
      success: true,
      count: result.rows.length,
      total: parseInt(stats.total),
      media: parseFloat(stats.media) || 0,
      distribuicao: {
        5: parseInt(stats.estrelas_5),
        4: parseInt(stats.estrelas_4),
        3: parseInt(stats.estrelas_3),
        2: parseInt(stats.estrelas_2),
        1: parseInt(stats.estrelas_1),
      },
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(stats.total / limite),
      data: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar avaliações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar avaliações',
    });
  }
};

// PUT /api/avaliacoes/:id - Atualizar avaliação
const atualizarAvaliacao = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { id } = req.params;
    const { nota } = req.body;

    if (nota && (nota < 1 || nota > 5)) {
      return res.status(400).json({
        success: false,
        error: 'Nota deve estar entre 1 e 5',
      });
    }

    const result = await pool.query(
      'UPDATE avaliacoes SET nota = $1 WHERE id = $2 AND usuario_id = $3 RETURNING *',
      [nota, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Avaliação não encontrada',
      });
    }

    res.json({
      success: true,
      message: 'Avaliação atualizada com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar avaliação',
    });
  }
};

// DELETE /api/avaliacoes/:id - Deletar avaliação
const deletarAvaliacao = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const isAdmin = req.usuario.is_admin;
    const { id } = req.params;

    let query = 'UPDATE avaliacoes SET ativo = false WHERE id = $1';
    const params = [id];

    if (!isAdmin) {
      query += ' AND usuario_id = $2';
      params.push(userId);
    }

    query += ' RETURNING *';

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Avaliação não encontrada',
      });
    }

    res.json({
      success: true,
      message: 'Avaliação removida com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar avaliação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar avaliação',
    });
  }
};

// POST /api/comentarios/:id/util - Marcar comentário como útil
const marcarUtil = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE comentarios SET curtidas = curtidas + 1 WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Comentário não encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Comentário marcado como útil',
      data: { curtidas: result.rows[0].curtidas },
    });
  } catch (error) {
    console.error('Erro ao marcar comentário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar ação',
    });
  }
};

// POST /api/produtos/:id/comentarios - Adicionar comentário
const adicionarComentario = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { id: produtoId } = req.params;
    const { texto } = req.body;

    if (!texto || texto.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Texto do comentário é obrigatório',
      });
    }

    // Verificar se produto existe
    const produtoExiste = await pool.query(
      'SELECT id FROM produtos WHERE id = $1 AND ativo = true',
      [produtoId]
    );

    if (produtoExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
      });
    }

    // Verificar se usuário comprou o produto
    const comprouProduto = await pool.query(
      `SELECT COUNT(*) as compras
       FROM itens_pedido ip
       JOIN pedidos p ON ip.pedido_id = p.id
       WHERE p.usuario_id = $1 
       AND ip.produto_id = $2 
       AND p.status IN ('entregue', 'pago')`,
      [userId, produtoId]
    );

    const verificadoCompra = parseInt(comprouProduto.rows[0].compras) > 0;

    const result = await pool.query(
      `INSERT INTO comentarios (produto_id, usuario_id, texto, verificado_compra)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [produtoId, userId, texto, verificadoCompra]
    );

    res.status(201).json({
      success: true,
      message: 'Comentário adicionado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao adicionar comentário',
    });
  }
};

// GET /api/produtos/:id/comentarios - Listar comentários
const listarComentarios = async (req, res) => {
  try {
    const { id: produtoId } = req.params;
    const { ordem = 'recente', limite = 10, pagina = 1 } = req.query;
    const offset = (pagina - 1) * limite;

    let ordenacao = 'c.data_comentario DESC';
    if (ordem === 'mais_uteis') {
      ordenacao = 'c.curtidas DESC, c.data_comentario DESC';
    }

    const result = await pool.query(
      `SELECT 
         c.id, c.texto, c.curtidas, c.data_comentario, c.verificado_compra,
         u.nome as usuario_nome
       FROM comentarios c
       JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.produto_id = $1 AND c.ativo = true
       ORDER BY ${ordenacao}
       LIMIT $2 OFFSET $3`,
      [produtoId, limite, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM comentarios WHERE produto_id = $1 AND ativo = true',
      [produtoId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      total: parseInt(countResult.rows[0].count),
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(countResult.rows[0].count / limite),
      data: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar comentários:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar comentários',
    });
  }
};

module.exports = {
  criarAvaliacao,
  listarAvaliacoes,
  atualizarAvaliacao,
  deletarAvaliacao,
  marcarUtil,
  adicionarComentario,
  listarComentarios,
};
