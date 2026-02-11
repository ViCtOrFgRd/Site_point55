const { pool } = require('../config/database');

// POST /api/cupons/validar - Validar cupom de desconto
const validarCupom = async (req, res) => {
  try {
    const { codigo, subtotal } = req.body;
    const usuarioId = req.usuario?.id;

    if (!codigo) {
      return res.status(400).json({
        success: false,
        error: 'Codigo do cupom e obrigatorio',
      });
    }

    if (subtotal === undefined || subtotal === null || Number.isNaN(parseFloat(subtotal))) {
      return res.status(400).json({
        success: false,
        error: 'Cupom invalido',
      });
    }

    // Buscar cupom
    const result = await pool.query(
      `SELECT * FROM cupons 
       WHERE codigo = $1 AND ativo = true`,
      [codigo.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cupom invalido',
      });
    }

    const cupom = result.rows[0];

    // Verificar validade
    if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Cupom invalido',
      });
    }

    // Verificar limite de uso
    if (cupom.usos_maximos && cupom.usos_atuais >= cupom.usos_maximos) {
      return res.status(400).json({
        success: false,
        error: 'Cupom esgotado',
      });
    }

    const subtotalNumero = parseFloat(subtotal);
    if (cupom.valor_minimo && subtotalNumero < parseFloat(cupom.valor_minimo)) {
      return res.status(400).json({
        success: false,
        error: 'Cupom invalido',
      });
    }

    if (usuarioId) {
      const jaUsouResult = await pool.query(
        `SELECT id FROM cupons_usuarios
         WHERE cupom_id = $1 AND usuario_id = $2`,
        [cupom.id, usuarioId]
      );

      if (jaUsouResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Ja utilizado',
        });
      }
    }

    // Cupom válido
    res.json({
      success: true,
      message: 'Cupom valido',
      data: {
        id: cupom.id,
        codigo: cupom.codigo,
        descricao: cupom.descricao,
        tipo_desconto: cupom.tipo_desconto,
        valor_desconto: cupom.valor_desconto,
        valor_minimo: cupom.valor_minimo,
        usos_atuais: cupom.usos_atuais,
        usos_maximos: cupom.usos_maximos,
      },
    });
  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao validar cupom',
    });
  }
};

// GET /api/cupons/historico/:cupomId - Historico de uso do cupom (admin)
const listarHistoricoCupons = async (req, res) => {
  try {
    const { cupomId } = req.params;
    const { limite = 50, pagina = 1 } = req.query;
    const offset = (pagina - 1) * limite;

    const cupomResult = await pool.query(
      'SELECT * FROM cupons WHERE id = $1',
      [cupomId]
    );

    if (cupomResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cupom nao encontrado',
      });
    }

    const historicoResult = await pool.query(
      `SELECT
        cu.id,
        cu.cupom_id,
        cu.usuario_id,
        u.nome as usuario_nome,
        u.email as usuario_email,
        cu.pedido_id,
        cu.data_uso,
        p.total as pedido_valor
      FROM cupons_usuarios cu
      JOIN usuarios u ON cu.usuario_id = u.id
      LEFT JOIN pedidos p ON cu.pedido_id = p.id
      WHERE cu.cupom_id = $1
      ORDER BY cu.data_uso DESC
      LIMIT $2 OFFSET $3`,
      [cupomId, parseInt(limite, 10), offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM cupons_usuarios WHERE cupom_id = $1',
      [cupomId]
    );

    res.json({
      success: true,
      cupom: cupomResult.rows[0],
      historico: historicoResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
      pagina: parseInt(pagina, 10),
      limite: parseInt(limite, 10),
    });
  } catch (error) {
    console.error('Erro ao listar historico:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar historico',
    });
  }
};

// GET /api/cupons - Listar cupons (admin)
const listarCupons = async (req, res) => {
  try {
    const { ativo } = req.query;
    let query = 'SELECT * FROM cupons';
    const params = [];

    if (ativo !== undefined) {
      query += ' WHERE ativo = $1';
      params.push(ativo === 'true');
    }

    query += ' ORDER BY data_criacao DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar cupons:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar cupons',
    });
  }
};

// POST /api/cupons - Criar novo cupom (admin)
const criarCupom = async (req, res) => {
  try {
    const {
      codigo,
      descricao,
      tipo_desconto,
      valor_desconto,
      valor_minimo,
      data_validade,
      usos_maximos,
      ativo,
    } = req.body;

    // Validação
    if (!codigo || !tipo_desconto || valor_desconto === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Código, tipo e valor de desconto são obrigatórios',
      });
    }

    if (!['percentual', 'fixo'].includes(tipo_desconto)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de desconto deve ser "percentual" ou "fixo"',
      });
    }

    // Verificar se código já existe
    const existente = await pool.query(
      'SELECT id FROM cupons WHERE codigo = $1',
      [codigo.toUpperCase()]
    );

    if (existente.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Código de cupom já existe',
      });
    }

    const result = await pool.query(
      `INSERT INTO cupons 
       (codigo, descricao, tipo_desconto, valor_desconto, valor_minimo, data_validade, usos_maximos, usos_atuais, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8)
       RETURNING *`,
      [
        codigo.toUpperCase(),
        descricao || null,
        tipo_desconto,
        parseFloat(valor_desconto),
        valor_minimo ? parseFloat(valor_minimo) : null,
        data_validade ? data_validade : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        usos_maximos ? parseInt(usos_maximos) : null,
        ativo !== undefined ? ativo : true,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Cupom criado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao criar cupom:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar cupom',
    });
  }
};

// PUT /api/cupons/:id - Atualizar cupom (admin)
const atualizarCupom = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      codigo,
      descricao,
      tipo_desconto,
      valor_desconto,
      valor_minimo,
      data_validade,
      usos_maximos,
      ativo,
    } = req.body;

    if (tipo_desconto && !['percentual', 'fixo'].includes(tipo_desconto)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de desconto deve ser "percentual" ou "fixo"',
      });
    }

    const cupomAtual = await pool.query('SELECT * FROM cupons WHERE id = $1', [id]);
    if (cupomAtual.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cupom não encontrado',
      });
    }

    if (codigo) {
      const existente = await pool.query(
        'SELECT id FROM cupons WHERE codigo = $1 AND id != $2',
        [codigo.toUpperCase(), id]
      );

      if (existente.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Código de cupom já existe',
        });
      }
    }

    const result = await pool.query(
      `UPDATE cupons 
       SET codigo = COALESCE($1, codigo),
           descricao = COALESCE($2, descricao),
           tipo_desconto = COALESCE($3, tipo_desconto),
           valor_desconto = COALESCE($4, valor_desconto),
           valor_minimo = COALESCE($5, valor_minimo),
           data_validade = COALESCE($6, data_validade),
           usos_maximos = COALESCE($7, usos_maximos),
           ativo = COALESCE($8, ativo)
       WHERE id = $9
       RETURNING *`,
      [
        codigo ? codigo.toUpperCase() : null,
        descricao ?? null,
        tipo_desconto ?? null,
        valor_desconto !== undefined ? parseFloat(valor_desconto) : null,
        valor_minimo !== undefined && valor_minimo !== null ? parseFloat(valor_minimo) : null,
        data_validade ?? null,
        usos_maximos !== undefined && usos_maximos !== null ? parseInt(usos_maximos, 10) : null,
        ativo !== undefined ? ativo : null,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Cupom atualizado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar cupom:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar cupom',
    });
  }
};

// DELETE /api/cupons/:id - Desativar cupom (admin)
const deletarCupom = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE cupons SET ativo = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cupom não encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Cupom desativado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao deletar cupom:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar cupom',
    });
  }
};

module.exports = {
  validarCupom,
  listarCupons,
  criarCupom,
  atualizarCupom,
  deletarCupom,
  listarHistoricoCupons,
};
