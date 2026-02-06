const { pool } = require('../config/database');

// POST /api/newsletter - Inscrever email na newsletter
const inscreverNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    // Validação
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório',
      });
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido',
      });
    }

    // Verificar se já está inscrito
    const existente = await pool.query(
      'SELECT id, ativo FROM newsletter WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existente.rows.length > 0) {
      const inscricao = existente.rows[0];
      
      if (inscricao.ativo) {
        return res.status(400).json({
          success: false,
          error: 'Email já está inscrito na newsletter',
        });
      } else {
        // Reativar inscrição
        await pool.query(
          'UPDATE newsletter SET ativo = true WHERE id = $1',
          [inscricao.id]
        );
        
        return res.json({
          success: true,
          message: 'Inscrição reativada com sucesso!',
        });
      }
    }

    // Criar nova inscrição
    await pool.query(
      'INSERT INTO newsletter (email, ativo) VALUES ($1, true)',
      [email.toLowerCase()]
    );

    res.status(201).json({
      success: true,
      message: 'Email inscrito com sucesso na newsletter!',
    });
  } catch (error) {
    console.error('Erro ao inscrever na newsletter:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar inscrição',
    });
  }
};

// DELETE /api/newsletter - Cancelar inscrição
const cancelarInscricao = async (req, res) => {
  try {
    // Aceitar email tanto no body quanto como query param
    const email = req.body.email || req.query.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório',
      });
    }

    const result = await pool.query(
      'UPDATE newsletter SET ativo = false WHERE email = $1 AND ativo = true RETURNING *',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inscrição não encontrada',
      });
    }

    res.json({
      success: true,
      message: 'Inscrição cancelada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao cancelar inscrição:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao cancelar inscrição',
    });
  }
};

// GET /api/newsletter - Listar inscritos (admin)
const listarInscritos = async (req, res) => {
  try {
    const { ativo = true, limite = 100, pagina = 1 } = req.query;
    const offset = (pagina - 1) * limite;

    const result = await pool.query(
      `SELECT * FROM newsletter 
       WHERE ativo = $1 
       ORDER BY data_inscricao DESC 
       LIMIT $2 OFFSET $3`,
      [ativo, limite, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM newsletter WHERE ativo = $1',
      [ativo]
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
    console.error('Erro ao listar inscritos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar inscritos',
    });
  }
};

module.exports = {
  inscreverNewsletter,
  cancelarInscricao,
  listarInscritos,
};
