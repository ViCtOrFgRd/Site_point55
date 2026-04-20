const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate } = require('../middlewares/authenticate');
const { isAdmin } = require('../middlewares/authorize');

// ==================== ROTAS ADMIN ====================

/**
 * GET /api/usuarios
 * Listar todos os usuários (apenas admin)
 */
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { pagina = 1, limite = 50 } = req.query;
    const offset = (pagina - 1) * limite;

    const result = await pool.query(
      `SELECT id, nome, email, is_admin, data_cadastro as data_criacao
       FROM usuarios 
       ORDER BY data_cadastro DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limite), parseInt(offset)]
    );

    const countResult = await pool.query('SELECT COUNT(*) as total FROM usuarios');
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: total,
        pagina: parseInt(pagina),
        totalPaginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar usuários',
    });
  }
});

/**
 * GET /api/usuarios/:id
 * Obter usuário específico (apenas admin)
 */
router.get('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, nome, email, telefone, cpf, data_nascimento, is_admin, data_cadastro as data_criacao
       FROM usuarios 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar usuário',
    });
  }
});

/**
 * PATCH /api/usuarios/:id/admin
 * Alternar permissão de admin (apenas admin)
 */
router.patch('/:id/admin', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Não permitir que o admin remova sua própria permissão
    if (parseInt(id) === req.usuario.id) {
      return res.status(400).json({
        success: false,
        error: 'Você não pode alterar suas próprias permissões',
      });
    }

    // Buscar usuário
    const result = await pool.query(
      'SELECT id, nome, email, is_admin FROM usuarios WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    const usuario = result.rows[0];
    const novoStatus = !usuario.is_admin;

    // Atualizar permissão
    await pool.query('UPDATE usuarios SET is_admin = $1 WHERE id = $2', [novoStatus, id]);

    res.json({
      success: true,
      message: `Permissões de ${usuario.nome} atualizadas com sucesso`,
      data: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        is_admin: novoStatus,
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar permissões:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar permissões',
    });
  }
});

/**
 * DELETE /api/usuarios/:id
 * Deletar usuário comum (apenas admin)
 */
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (Number.isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de usuário inválido',
      });
    }

    if (userId === req.usuario.id) {
      return res.status(400).json({
        success: false,
        error: 'Você não pode excluir sua própria conta',
      });
    }

    const result = await pool.query(
      'SELECT id, nome, email, is_admin FROM usuarios WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    const usuario = result.rows[0];

    if (usuario.is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Não é permitido excluir um usuário administrador',
      });
    }

    await pool.query('DELETE FROM usuarios WHERE id = $1', [userId]);

    return res.json({
      success: true,
      message: `Usuário ${usuario.nome} removido com sucesso`,
      data: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
    });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao deletar usuário',
    });
  }
});

module.exports = router;
