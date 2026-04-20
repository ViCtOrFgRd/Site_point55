const { pool } = require('../config/database');

const parsePagination = (query) => {
  const limite = Number.parseInt(query.limite, 10) || 20;
  const pagina = Number.parseInt(query.pagina, 10) || 1;
  const offset = (pagina - 1) * limite;
  return { limite, pagina, offset };
};

const listarNotificacoes = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { limite, pagina, offset } = parsePagination(req.query);

    const listQuery = `
      SELECT n.id, n.recipient_type, n.recipient_id, n.tipo_evento,
             n.titulo, n.mensagem, n.payload, n.criada_em,
             CASE WHEN n.recipient_type = 'all_users'
               THEN nu.lida_em
               ELSE n.lida_em
             END AS lida_em
      FROM notificacoes n
      LEFT JOIN notificacoes_usuarios nu
        ON nu.notificacao_id = n.id AND nu.usuario_id = $1
      WHERE (
        (n.recipient_type IN ('user', 'admin') AND n.recipient_id = $1)
        OR (n.recipient_type = 'all_users' AND nu.apagada_em IS NULL)
      )
      ORDER BY n.criada_em DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) AS total,
             SUM(CASE
               WHEN (
                 (n.recipient_type IN ('user', 'admin') AND n.recipient_id = $1 AND n.lida_em IS NULL)
                 OR (n.recipient_type = 'all_users' AND nu.apagada_em IS NULL AND nu.lida_em IS NULL)
               ) THEN 1 ELSE 0 END) AS nao_lidas
      FROM notificacoes n
      LEFT JOIN notificacoes_usuarios nu
        ON nu.notificacao_id = n.id AND nu.usuario_id = $1
      WHERE (
        (n.recipient_type IN ('user', 'admin') AND n.recipient_id = $1)
        OR (n.recipient_type = 'all_users' AND nu.apagada_em IS NULL)
      )
    `;

    const [listResult, countResult] = await Promise.all([
      pool.query(listQuery, [userId, limite, offset]),
      pool.query(countQuery, [userId]),
    ]);

    const total = Number.parseInt(countResult.rows[0].total, 10) || 0;
    const naoLidas = Number.parseInt(countResult.rows[0].nao_lidas, 10) || 0;

    res.json({
      success: true,
      count: listResult.rows.length,
      total,
      nao_lidas: naoLidas,
      pagina,
      totalPaginas: Math.ceil(total / limite),
      data: listResult.rows,
    });
  } catch (error) {
    console.error('Erro ao listar notificacoes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar notificacoes',
    });
  }
};

const obterNaoLidas = async (req, res) => {
  try {
    const userId = req.usuario.id;

    const query = `
      SELECT SUM(CASE
        WHEN (
          (n.recipient_type IN ('user', 'admin') AND n.recipient_id = $1 AND n.lida_em IS NULL)
          OR (n.recipient_type = 'all_users' AND nu.apagada_em IS NULL AND nu.lida_em IS NULL)
        ) THEN 1 ELSE 0 END) AS nao_lidas
      FROM notificacoes n
      LEFT JOIN notificacoes_usuarios nu
        ON nu.notificacao_id = n.id AND nu.usuario_id = $1
      WHERE (
        (n.recipient_type IN ('user', 'admin') AND n.recipient_id = $1)
        OR (n.recipient_type = 'all_users' AND nu.apagada_em IS NULL)
      )
    `;

    const result = await pool.query(query, [userId]);
    const naoLidas = Number.parseInt(result.rows[0].nao_lidas, 10) || 0;

    res.json({
      success: true,
      nao_lidas: naoLidas,
    });
  } catch (error) {
    console.error('Erro ao buscar nao lidas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar nao lidas',
    });
  }
};

const marcarLida = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { id } = req.params;

    const notificacaoResult = await pool.query(
      'SELECT id, recipient_type, recipient_id FROM notificacoes WHERE id = $1',
      [id]
    );

    if (notificacaoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notificacao nao encontrada',
      });
    }

    const notificacao = notificacaoResult.rows[0];

    if (notificacao.recipient_type === 'all_users') {
      await pool.query(
        `INSERT INTO notificacoes_usuarios (notificacao_id, usuario_id, lida_em)
         VALUES ($1, $2, NOW())
         ON CONFLICT (notificacao_id, usuario_id)
         DO UPDATE SET lida_em = COALESCE(notificacoes_usuarios.lida_em, EXCLUDED.lida_em)
         WHERE notificacoes_usuarios.apagada_em IS NULL`,
        [id, userId]
      );
    } else if (Number.parseInt(notificacao.recipient_id, 10) === userId) {
      await pool.query(
        'UPDATE notificacoes SET lida_em = NOW() WHERE id = $1 AND lida_em IS NULL',
        [id]
      );
    } else {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado',
      });
    }

    res.json({
      success: true,
      message: 'Notificacao marcada como lida',
    });
  } catch (error) {
    console.error('Erro ao marcar notificacao como lida:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao marcar notificacao como lida',
    });
  }
};

const marcarTodasLidas = async (req, res) => {
  try {
    const userId = req.usuario.id;

    await pool.query(
      `UPDATE notificacoes
       SET lida_em = NOW()
       WHERE recipient_id = $1
       AND recipient_type IN ('user', 'admin')
       AND lida_em IS NULL`,
      [userId]
    );

    await pool.query(
      `INSERT INTO notificacoes_usuarios (notificacao_id, usuario_id, lida_em)
       SELECT n.id, $1, NOW()
       FROM notificacoes n
       LEFT JOIN notificacoes_usuarios nu
         ON nu.notificacao_id = n.id AND nu.usuario_id = $1
       WHERE n.recipient_type = 'all_users'
         AND (nu.apagada_em IS NULL)
         AND (nu.lida_em IS NULL)
       ON CONFLICT (notificacao_id, usuario_id)
       DO UPDATE SET lida_em = COALESCE(notificacoes_usuarios.lida_em, EXCLUDED.lida_em)
       WHERE notificacoes_usuarios.apagada_em IS NULL`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Notificacoes marcadas como lidas',
    });
  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao marcar todas como lidas',
    });
  }
};

const excluirNotificacao = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { id } = req.params;

    const notificacaoResult = await pool.query(
      'SELECT id, recipient_type, recipient_id FROM notificacoes WHERE id = $1',
      [id]
    );

    if (notificacaoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notificacao nao encontrada',
      });
    }

    const notificacao = notificacaoResult.rows[0];

    if (notificacao.recipient_type === 'all_users') {
      await pool.query(
        `INSERT INTO notificacoes_usuarios (notificacao_id, usuario_id, apagada_em)
         VALUES ($1, $2, NOW())
         ON CONFLICT (notificacao_id, usuario_id)
         DO UPDATE SET apagada_em = NOW()`,
        [id, userId]
      );
    } else if (Number.parseInt(notificacao.recipient_id, 10) === userId) {
      await pool.query('DELETE FROM notificacoes WHERE id = $1', [id]);
    } else {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado',
      });
    }

    res.json({
      success: true,
      message: 'Notificacao removida',
    });
  } catch (error) {
    console.error('Erro ao remover notificacao:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao remover notificacao',
    });
  }
};

module.exports = {
  listarNotificacoes,
  obterNaoLidas,
  marcarLida,
  marcarTodasLidas,
  excluirNotificacao,
};
