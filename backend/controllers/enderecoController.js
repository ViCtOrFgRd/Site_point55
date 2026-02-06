const { pool } = require('../config/database');

// POST /api/enderecos - Adicionar novo endereço
const adicionarEndereco = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const {
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      is_principal,
    } = req.body;

    // Validação básica
    if (!cep || !rua || !numero || !bairro || !cidade || !estado) {
      return res.status(400).json({
        success: false,
        error: 'CEP, rua, número, bairro, cidade e estado são obrigatórios',
      });
    }

    // Se for endereço principal, desmarcar outros
    if (is_principal) {
      await pool.query(
        'UPDATE enderecos SET is_principal = false WHERE usuario_id = $1',
        [userId]
      );
    }

    const result = await pool.query(
      `INSERT INTO enderecos 
       (usuario_id, cep, rua, numero, complemento, bairro, cidade, estado, is_principal)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, cep, rua, numero, complemento, bairro, cidade, estado, is_principal || false]
    );

    res.status(201).json({
      success: true,
      message: 'Endereço adicionado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao adicionar endereço:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao adicionar endereço',
    });
  }
};

// GET /api/enderecos - Listar endereços do usuário
const listarEnderecos = async (req, res) => {
  try {
    const userId = req.usuario.id;

    const result = await pool.query(
      `SELECT * FROM enderecos 
       WHERE usuario_id = $1 
       ORDER BY is_principal DESC, data_criacao DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar endereços:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar endereços',
    });
  }
};

// GET /api/enderecos/:id - Obter endereço específico
const obterEndereco = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM enderecos WHERE id = $1 AND usuario_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Endereço não encontrado',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao obter endereço:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar endereço',
    });
  }
};

// PUT /api/enderecos/:id - Atualizar endereço
const atualizarEndereco = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { id } = req.params;
    const {
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      is_principal,
    } = req.body;

    // Verificar se endereço existe e pertence ao usuário
    const enderecoExiste = await pool.query(
      'SELECT id FROM enderecos WHERE id = $1 AND usuario_id = $2',
      [id, userId]
    );

    if (enderecoExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Endereço não encontrado',
      });
    }

    // Se for tornar principal, desmarcar outros
    if (is_principal) {
      await pool.query(
        'UPDATE enderecos SET is_principal = false WHERE usuario_id = $1 AND id != $2',
        [userId, id]
      );
    }

    const result = await pool.query(
      `UPDATE enderecos
       SET cep = COALESCE($1, cep),
           rua = COALESCE($2, rua),
           numero = COALESCE($3, numero),
           complemento = COALESCE($4, complemento),
           bairro = COALESCE($5, bairro),
           cidade = COALESCE($6, cidade),
           estado = COALESCE($7, estado),
           is_principal = COALESCE($8, is_principal)
       WHERE id = $9 AND usuario_id = $10
       RETURNING *`,
      [cep, rua, numero, complemento, bairro, cidade, estado, is_principal, id, userId]
    );

    res.json({
      success: true,
      message: 'Endereço atualizado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar endereço',
    });
  }
};

// DELETE /api/enderecos/:id - Deletar endereço
const deletarEndereco = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { id } = req.params;

    // Verificar se endereço existe e pertence ao usuário
    const enderecoExiste = await pool.query(
      'SELECT id FROM enderecos WHERE id = $1 AND usuario_id = $2',
      [id, userId]
    );

    if (enderecoExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Endereço não encontrado',
      });
    }

    await pool.query(
      'DELETE FROM enderecos WHERE id = $1 AND usuario_id = $2',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Endereço deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar endereço:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar endereço',
    });
  }
};

// PATCH /api/enderecos/:id/principal - Tornar endereço principal
const tornarPrincipal = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { id } = req.params;

    // Verificar se endereço existe e pertence ao usuário
    const enderecoExiste = await pool.query(
      'SELECT id FROM enderecos WHERE id = $1 AND usuario_id = $2',
      [id, userId]
    );

    if (enderecoExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Endereço não encontrado',
      });
    }

    // Desmarcar todos os endereços como principal
    await pool.query(
      'UPDATE enderecos SET is_principal = false WHERE usuario_id = $1',
      [userId]
    );

    // Marcar este como principal
    const result = await pool.query(
      'UPDATE enderecos SET is_principal = true WHERE id = $1 AND usuario_id = $2 RETURNING *',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Endereço definido como principal',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao tornar endereço principal:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar endereço',
    });
  }
};

module.exports = {
  adicionarEndereco,
  listarEnderecos,
  obterEndereco,
  atualizarEndereco,
  deletarEndereco,
  tornarPrincipal,
};
