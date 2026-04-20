const { pool } = require('../config/database');
const { notifyAllUsersPromotion } = require('../services/notificationService');

// GET /api/promocoes - Listar promoções ativas
const listarPromocoes = async (req, res) => {
  try {
    const { ativa } = req.query;

    let query = 'SELECT * FROM promocoes';
    const params = [];

    if (ativa !== undefined) {
      query += ' WHERE ativa = $1';
      params.push(ativa === 'true');
    }

    query += ' ORDER BY data_criacao DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar promoções:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar promoções',
    });
  }
};

// GET /api/promocoes/vigentes - Listar promoções vigentes (dentro do período)
const listarPromocoesVigentes = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM promocoes
       WHERE ativa = true
       AND data_inicio <= NOW()
       AND data_fim >= NOW()
       ORDER BY data_inicio DESC`
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar promoções vigentes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar promoções',
    });
  }
};

// GET /api/promocoes/:id - Obter promoção específica
const obterPromocao = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM promocoes WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Promoção não encontrada',
      });
    }

    // Buscar produtos aplicáveis
    const promocao = result.rows[0];
    if (promocao.produtos_aplicaveis && promocao.produtos_aplicaveis.length > 0) {
      const produtosResult = await pool.query(
        `SELECT id, nome, preco, imagens
         FROM produtos
         WHERE id = ANY($1)`,
        [promocao.produtos_aplicaveis]
      );
      promocao.produtos = produtosResult.rows;
    }

    res.json({
      success: true,
      data: promocao,
    });
  } catch (error) {
    console.error('Erro ao obter promoção:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar promoção',
    });
  }
};

// POST /api/promocoes - Criar nova promoção (admin)
const criarPromocao = async (req, res) => {
  try {
    const {
      nome,
      descricao,
      tipo_desconto,
      desconto_percentual,
      desconto_valor,
      data_inicio,
      data_fim,
      produtos_aplicaveis,
      ativa = true,
    } = req.body;

    // Validação
    if (!nome || !tipo_desconto || !data_inicio || !data_fim) {
      return res.status(400).json({
        success: false,
        error: 'Nome, tipo de desconto, data de início e fim são obrigatórios',
      });
    }

    if (!['percentual', 'valor_fixo'].includes(tipo_desconto)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de desconto deve ser "percentual" ou "valor_fixo"',
      });
    }

    if (tipo_desconto === 'percentual' && !desconto_percentual) {
      return res.status(400).json({
        success: false,
        error: 'Desconto percentual é obrigatório para tipo "percentual"',
      });
    }

    if (tipo_desconto === 'valor_fixo' && !desconto_valor) {
      return res.status(400).json({
        success: false,
        error: 'Valor de desconto é obrigatório para tipo "valor_fixo"',
      });
    }

    // Validar datas
    if (new Date(data_fim) <= new Date(data_inicio)) {
      return res.status(400).json({
        success: false,
        error: 'Data de fim deve ser posterior à data de início',
      });
    }

    const result = await pool.query(
      `INSERT INTO promocoes 
       (nome, descricao, tipo_desconto, desconto_percentual, desconto_valor, 
        data_inicio, data_fim, ativa, produtos_aplicaveis)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        nome,
        descricao,
        tipo_desconto,
        desconto_percentual,
        desconto_valor,
        data_inicio,
        data_fim,
        ativa,
        produtos_aplicaveis || [],
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Promoção criada com sucesso',
      data: result.rows[0],
    });

    try {
      const promocao = result.rows[0];
      if (promocao.ativa) {
        await notifyAllUsersPromotion({
          tipoEvento: 'promocao_publicada',
          titulo: 'Nova promocao',
          mensagem: promocao.descricao || `Promocao ${promocao.nome} disponivel agora.`,
          payload: {
            promocao_id: promocao.id,
            nome: promocao.nome,
            data_inicio: promocao.data_inicio,
            data_fim: promocao.data_fim,
          },
        });
      }
    } catch (notifyError) {
      console.error('Erro ao notificar promocao:', notifyError);
    }
  } catch (error) {
    console.error('Erro ao criar promoção:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar promoção',
    });
  }
};

// PUT /api/promocoes/:id - Atualizar promoção (admin)
const atualizarPromocao = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      descricao,
      tipo_desconto,
      desconto_percentual,
      desconto_valor,
      data_inicio,
      data_fim,
      ativa,
      produtos_aplicaveis,
    } = req.body;

    // Verificar se promoção existe
    const promocaoExiste = await pool.query(
      'SELECT id FROM promocoes WHERE id = $1',
      [id]
    );

    if (promocaoExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Promoção não encontrada',
      });
    }

    const result = await pool.query(
      `UPDATE promocoes
       SET nome = COALESCE($1, nome),
           descricao = COALESCE($2, descricao),
           tipo_desconto = COALESCE($3, tipo_desconto),
           desconto_percentual = COALESCE($4, desconto_percentual),
           desconto_valor = COALESCE($5, desconto_valor),
           data_inicio = COALESCE($6, data_inicio),
           data_fim = COALESCE($7, data_fim),
           ativa = COALESCE($8, ativa),
           produtos_aplicaveis = COALESCE($9, produtos_aplicaveis)
       WHERE id = $10
       RETURNING *`,
      [
        nome,
        descricao,
        tipo_desconto,
        desconto_percentual,
        desconto_valor,
        data_inicio,
        data_fim,
        ativa,
        produtos_aplicaveis,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Promoção atualizada com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar promoção:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar promoção',
    });
  }
};

// DELETE /api/promocoes/:id - Deletar promoção (admin)
const deletarPromocao = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM promocoes WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Promoção não encontrada',
      });
    }

    res.json({
      success: true,
      message: 'Promoção deletada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar promoção:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar promoção',
    });
  }
};

// PATCH /api/promocoes/:id/ativar - Ativar/desativar promoção (admin)
const togglePromocao = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE promocoes SET ativa = NOT ativa WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Promoção não encontrada',
      });
    }

    res.json({
      success: true,
      message: `Promoção ${result.rows[0].ativa ? 'ativada' : 'desativada'} com sucesso`,
      data: result.rows[0],
    });

    try {
      const promocao = result.rows[0];
      if (promocao.ativa) {
        await notifyAllUsersPromotion({
          tipoEvento: 'promocao_publicada',
          titulo: 'Promocao ativada',
          mensagem: promocao.descricao || `Promocao ${promocao.nome} esta ativa.`,
          payload: {
            promocao_id: promocao.id,
            nome: promocao.nome,
            data_inicio: promocao.data_inicio,
            data_fim: promocao.data_fim,
          },
        });
      }
    } catch (notifyError) {
      console.error('Erro ao notificar promocao:', notifyError);
    }
  } catch (error) {
    console.error('Erro ao ativar/desativar promoção:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar promoção',
    });
  }
};

// GET /api/produtos/:id/promocoes - Verificar promoções aplicáveis ao produto
const verificarPromocoesAplicaveis = async (req, res) => {
  try {
    const { id: produtoId } = req.params;

    const result = await pool.query(
      `SELECT * FROM promocoes
       WHERE ativa = true
       AND data_inicio <= NOW()
       AND data_fim >= NOW()
       AND (
         produtos_aplicaveis IS NULL
         OR produtos_aplicaveis = '{}'
         OR $1 = ANY(produtos_aplicaveis)
       )
       ORDER BY desconto_percentual DESC, desconto_valor DESC`,
      [produtoId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Erro ao verificar promoções:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar promoções',
    });
  }
};

module.exports = {
  listarPromocoes,
  listarPromocoesVigentes,
  obterPromocao,
  criarPromocao,
  atualizarPromocao,
  deletarPromocao,
  togglePromocao,
  verificarPromocoesAplicaveis,
};
