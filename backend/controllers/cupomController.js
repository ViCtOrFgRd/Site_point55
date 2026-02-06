const { pool } = require('../config/database');

// POST /api/cupons/validar - Validar cupom de desconto
const validarCupom = async (req, res) => {
  try {
    const { codigo } = req.body;

    if (!codigo) {
      return res.status(400).json({
        success: false,
        error: 'Código do cupom é obrigatório',
      });
    }

    // Buscar cupom
    const result = await pool.query(
      `SELECT * FROM cupons 
       WHERE codigo = $1 AND ativo = true`,
      [codigo.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cupom não encontrado ou inválido',
      });
    }

    const cupom = result.rows[0];

    // Verificar validade
    if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Cupom expirado',
      });
    }

    // Verificar limite de uso
    if (cupom.usos_maximos && cupom.usos_atuais >= cupom.usos_maximos) {
      return res.status(400).json({
        success: false,
        error: 'Cupom esgotado',
      });
    }

    // Cupom válido
    res.json({
      success: true,
      message: 'Cupom válido',
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

// GET /api/cupons - Listar cupons ativos (admin)
const listarCupons = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM cupons 
       WHERE ativo = true
       ORDER BY data_criacao DESC`
    );

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
    const { ativo, usos_maximos, data_validade } = req.body;

    const result = await pool.query(
      `UPDATE cupons 
       SET ativo = COALESCE($1, ativo),
           usos_maximos = COALESCE($2, usos_maximos),
           data_validade = COALESCE($3, data_validade)
       WHERE id = $4
       RETURNING *`,
      [ativo, usos_maximos, data_validade, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cupom não encontrado',
      });
    }

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
};
