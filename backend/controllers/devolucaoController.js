const { pool } = require('../config/database');
const { notifyAdmins, notifyUser } = require('../services/notificationService');

const STATUS_ABERTOS = ['solicitado', 'em_analise', 'aprovado', 'recorre'];
const STATUS_ADMIN = ['em_analise', 'aprovado', 'recusado', 'concluido'];
const TIPOS = ['troca', 'devolucao'];

const parseItems = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [];
};

const toInteger = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const toTrimmedString = (value) => {
  if (!value) return '';
  return String(value).trim();
};

const montarResposta = (devolucoes, itens, anexos) => {
  const itensPorDevolucao = itens.reduce((acc, item) => {
    if (!acc[item.devolucao_id]) acc[item.devolucao_id] = [];
    acc[item.devolucao_id].push(item);
    return acc;
  }, {});

  const anexosPorDevolucao = anexos.reduce((acc, anexo) => {
    if (!acc[anexo.devolucao_id]) acc[anexo.devolucao_id] = [];
    acc[anexo.devolucao_id].push(anexo);
    return acc;
  }, {});

  return devolucoes.map((devolucao) => ({
    ...devolucao,
    itens: itensPorDevolucao[devolucao.id] || [],
    anexos: anexosPorDevolucao[devolucao.id] || [],
  }));
};

const criarDevolucao = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.usuario.id;
    const {
      pedido_id,
      tipo,
      motivo,
      justificativa,
      observacoes,
      itens,
    } = req.body;

    const itensParsed = parseItems(itens);
    const tipoNormalizado = toTrimmedString(tipo);
    const motivoNormalizado = toTrimmedString(motivo);
    const justificativaNormalizada = toTrimmedString(justificativa);
    const observacoesNormalizadas = toTrimmedString(observacoes) || null;
    const pedidoId = toInteger(pedido_id);

    if (!pedidoId) {
      return res.status(400).json({
        success: false,
        error: 'Pedido invalido',
      });
    }

    if (!TIPOS.includes(tipoNormalizado)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo invalido. Use troca ou devolucao',
      });
    }

    if (!motivoNormalizado || motivoNormalizado.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Motivo obrigatorio',
      });
    }

    if (!justificativaNormalizada || justificativaNormalizada.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Justificativa obrigatoria (minimo 10 caracteres)',
      });
    }

    if (!itensParsed || itensParsed.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Itens obrigatorios',
      });
    }

    await client.query('BEGIN');

    const pedidoResult = await client.query(
      'SELECT id, usuario_id, status FROM pedidos WHERE id = $1',
      [pedidoId]
    );

    if (pedidoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Pedido nao encontrado',
      });
    }

    const pedido = pedidoResult.rows[0];

    if (pedido.usuario_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        error: 'Pedido nao pertence ao usuario',
      });
    }

    const statusApto = ['devolucao', 'entregue'].includes(pedido.status);

    if (!statusApto) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Devolucao disponivel apenas para pedidos em devolucao ou entregues',
      });
    }

    const existingResult = await client.query(
      `SELECT id FROM devolucoes
       WHERE pedido_id = $1 AND usuario_id = $2
       AND status = ANY($3::text[])`,
      [pedidoId, userId, STATUS_ABERTOS]
    );

    if (existingResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Ja existe uma solicitacao em andamento para este pedido',
      });
    }

    const devolucaoResult = await client.query(
      `INSERT INTO devolucoes
       (usuario_id, pedido_id, tipo, status, motivo, justificativa, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        pedidoId,
        tipoNormalizado,
        'solicitado',
        motivoNormalizado,
        justificativaNormalizada,
        observacoesNormalizadas,
      ]
    );

    const devolucao = devolucaoResult.rows[0];

    await client.query(
      `UPDATE pedidos
       SET status = 'devolucao', data_atualizacao = NOW()
       WHERE id = $1`,
      [pedidoId]
    );

    const itensPedidoResult = await client.query(
      `SELECT id, produto_id, quantidade, tamanho, cor
       FROM itens_pedido
       WHERE pedido_id = $1`,
      [pedidoId]
    );

    const itensPedidoMap = itensPedidoResult.rows.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});

    for (const item of itensParsed) {
      const pedidoItemId = toInteger(item.pedido_item_id || item.pedidoItemId || item.id);
      const quantidade = toInteger(item.quantidade);
      const motivoItem = toTrimmedString(item.motivo_item || item.motivoItem || '') || null;

      if (!pedidoItemId || !quantidade || quantidade <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Itens invalidos',
        });
      }

      const itemPedido = itensPedidoMap[pedidoItemId];

      if (!itemPedido) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Item nao pertence ao pedido',
        });
      }

      if (quantidade > itemPedido.quantidade) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Quantidade solicitada maior que a comprada',
        });
      }

      await client.query(
        `INSERT INTO devolucao_itens
         (devolucao_id, pedido_item_id, produto_id, quantidade, tamanho, cor, motivo_item)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          devolucao.id,
          pedidoItemId,
          itemPedido.produto_id,
          quantidade,
          itemPedido.tamanho,
          itemPedido.cor,
          motivoItem,
        ]
      );
    }

    const anexos = Array.isArray(req.files) ? req.files : [];

    for (const arquivo of anexos) {
      const arquivoUrl = `/image/${arquivo.filename}`;
      await client.query(
        `INSERT INTO devolucao_anexos (devolucao_id, arquivo_url, arquivo_nome)
         VALUES ($1, $2, $3)`,
        [devolucao.id, arquivoUrl, arquivo.originalname]
      );
    }

    await client.query('COMMIT');

    try {
      const usuarioResult = await pool.query(
        'SELECT nome FROM usuarios WHERE id = $1',
        [userId]
      );
      const nomeUsuario = usuarioResult.rows[0]?.nome || `ID ${userId}`;

      await notifyAdmins({
        tipoEvento: 'devolucao_nova',
        titulo: 'Nova devolucao',
        mensagem: `Devolucao #${devolucao.id} criada por ${nomeUsuario} para o pedido #${pedidoId}.`,
        payload: {
          devolucao_id: devolucao.id,
          pedido_id: pedidoId,
          usuario_id: userId,
          usuario_nome: nomeUsuario,
        },
      });
    } catch (notifyError) {
      console.error('Erro ao notificar admins:', notifyError);
    }

    res.status(201).json({
      success: true,
      message: 'Solicitacao enviada com sucesso',
      data: devolucao,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar devolucao:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar devolucao',
    });
  } finally {
    client.release();
  }
};

const listarDevolucoes = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const isAdmin = req.usuario.is_admin;
    const { status, pedido_id, pagina = 1, limite = 20 } = req.query;
    const offset = (pagina - 1) * limite;

    let query = `
      SELECT d.*, u.nome as usuario_nome, u.email as usuario_email,
             p.status as pedido_status
      FROM devolucoes d
      LEFT JOIN usuarios u ON d.usuario_id = u.id
      LEFT JOIN pedidos p ON d.pedido_id = p.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (!isAdmin) {
      query += ` AND d.usuario_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }

    if (status) {
      query += ` AND d.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (pedido_id) {
      query += ` AND d.pedido_id = $${paramCount}`;
      params.push(pedido_id);
      paramCount++;
    }

    query += ` ORDER BY d.data_criacao DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limite, offset);

    const devolucoesResult = await pool.query(query, params);
    const devolucoes = devolucoesResult.rows;

    if (devolucoes.length === 0) {
      return res.json({
        success: true,
        count: 0,
        total: 0,
        pagina: parseInt(pagina, 10),
        totalPaginas: 0,
        data: [],
      });
    }

    const devolucaoIds = devolucoes.map((item) => item.id);

    const itensResult = await pool.query(
      `SELECT di.*, p.nome as produto_nome
       FROM devolucao_itens di
       LEFT JOIN produtos p ON di.produto_id = p.id
       WHERE di.devolucao_id = ANY($1::int[])`,
      [devolucaoIds]
    );

    const anexosResult = await pool.query(
      `SELECT * FROM devolucao_anexos
       WHERE devolucao_id = ANY($1::int[])`,
      [devolucaoIds]
    );

    let countQuery = 'SELECT COUNT(*) FROM devolucoes WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;

    if (!isAdmin) {
      countQuery += ` AND usuario_id = $${countParamCount}`;
      countParams.push(userId);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (pedido_id) {
      countQuery += ` AND pedido_id = $${countParamCount}`;
      countParams.push(pedido_id);
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      count: devolucoes.length,
      total: parseInt(countResult.rows[0].count, 10),
      pagina: parseInt(pagina, 10),
      totalPaginas: Math.ceil(countResult.rows[0].count / limite),
      data: montarResposta(devolucoes, itensResult.rows, anexosResult.rows),
    });
  } catch (error) {
    console.error('Erro ao listar devolucoes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar devolucoes',
    });
  }
};

const obterDevolucao = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const isAdmin = req.usuario.is_admin;
    const { id } = req.params;

    let query = `
      SELECT d.*, u.nome as usuario_nome, u.email as usuario_email,
             p.status as pedido_status
      FROM devolucoes d
      LEFT JOIN usuarios u ON d.usuario_id = u.id
      LEFT JOIN pedidos p ON d.pedido_id = p.id
      WHERE d.id = $1
    `;

    const params = [id];

    if (!isAdmin) {
      query += ' AND d.usuario_id = $2';
      params.push(userId);
    }

    const devolucaoResult = await pool.query(query, params);

    if (devolucaoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Solicitacao nao encontrada',
      });
    }

    const devolucao = devolucaoResult.rows[0];

    const itensResult = await pool.query(
      `SELECT di.*, p.nome as produto_nome
       FROM devolucao_itens di
       LEFT JOIN produtos p ON di.produto_id = p.id
       WHERE di.devolucao_id = $1`,
      [id]
    );

    const anexosResult = await pool.query(
      `SELECT * FROM devolucao_anexos WHERE devolucao_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: montarResposta([devolucao], itensResult.rows, anexosResult.rows)[0],
    });
  } catch (error) {
    console.error('Erro ao obter devolucao:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar devolucao',
    });
  }
};

const atualizarStatus = async (req, res) => {
  try {
    const adminId = req.usuario.id;
    const { id } = req.params;
    const { status, admin_decisao, admin_instrucoes } = req.body;

    if (!status || !STATUS_ADMIN.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status invalido',
      });
    }

    const adminDecisao = toTrimmedString(admin_decisao) || null;
    const adminInstrucoes = toTrimmedString(admin_instrucoes) || null;

    const result = await pool.query(
      `UPDATE devolucoes
       SET status = $1,
           admin_decisao = $2,
           admin_instrucoes = $3,
           aprovado_por = $4,
           data_atualizacao = NOW()
       WHERE id = $5
       RETURNING *`,
      [status, adminDecisao, adminInstrucoes, adminId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Solicitacao nao encontrada',
      });
    }

    const devolucaoAtualizada = result.rows[0];

    if (devolucaoAtualizada.pedido_id) {
      let novoStatusPedido = null;

      if (status === 'concluido') {
        novoStatusPedido = 'devolvido';
      } else if (status === 'recusado') {
        novoStatusPedido = 'entregue';
      } else if (status === 'em_analise' || status === 'aprovado') {
        novoStatusPedido = 'devolucao';
      }

      if (novoStatusPedido) {
        await pool.query(
          `UPDATE pedidos
           SET status = $1, data_atualizacao = NOW()
           WHERE id = $2`,
          [novoStatusPedido, devolucaoAtualizada.pedido_id]
        );
      }
    }

    res.json({
      success: true,
      message: 'Status atualizado com sucesso',
      data: devolucaoAtualizada,
    });

    try {
      if (devolucaoAtualizada.usuario_id) {
        await notifyUser(devolucaoAtualizada.usuario_id, {
          tipoEvento: 'devolucao_status',
          titulo: 'Status da devolucao atualizado',
          mensagem: `Sua devolucao #${devolucaoAtualizada.id} agora esta em '${devolucaoAtualizada.status}'.`,
          payload: {
            devolucao_id: devolucaoAtualizada.id,
            pedido_id: devolucaoAtualizada.pedido_id,
            status: devolucaoAtualizada.status,
            admin_decisao: devolucaoAtualizada.admin_decisao,
            admin_instrucoes: devolucaoAtualizada.admin_instrucoes,
          },
        });
      }
    } catch (notifyError) {
      console.error('Erro ao notificar usuario:', notifyError);
    }
  } catch (error) {
    console.error('Erro ao atualizar status da devolucao:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar status',
    });
  }
};

const recorrerDevolucao = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { id } = req.params;
    const { justificativa } = req.body;

    const justificativaNormalizada = toTrimmedString(justificativa);

    if (!justificativaNormalizada || justificativaNormalizada.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Justificativa obrigatoria (minimo 10 caracteres)',
      });
    }

    const devolucaoResult = await pool.query(
      `SELECT id, status, usuario_id
       FROM devolucoes
       WHERE id = $1`,
      [id]
    );

    if (devolucaoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Solicitacao nao encontrada',
      });
    }

    const devolucao = devolucaoResult.rows[0];

    if (devolucao.usuario_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Solicitacao nao pertence ao usuario',
      });
    }

    if (devolucao.status !== 'recusado') {
      return res.status(400).json({
        success: false,
        error: 'Apenas solicitacoes recusadas podem recorrer',
      });
    }

    const result = await pool.query(
      `UPDATE devolucoes
       SET status = 'recorre',
           justificativa_recorrencia = $1,
           data_recorrencia = NOW(),
           data_atualizacao = NOW()
       WHERE id = $2
       RETURNING *`,
      [justificativaNormalizada, id]
    );

    res.json({
      success: true,
      message: 'Recorrencia enviada com sucesso',
      data: result.rows[0],
    });

    try {
      const usuarioResult = await pool.query(
        'SELECT nome FROM usuarios WHERE id = $1',
        [userId]
      );
      const nomeUsuario = usuarioResult.rows[0]?.nome || `ID ${userId}`;

      await notifyAdmins({
        tipoEvento: 'devolucao_recorre',
        titulo: 'Recorrencia de devolucao',
        mensagem: `Devolucao #${result.rows[0].id} recebeu recorrencia de ${nomeUsuario}.`,
        payload: {
          devolucao_id: result.rows[0].id,
          usuario_id: userId,
          usuario_nome: nomeUsuario,
        },
      });
    } catch (notifyError) {
      console.error('Erro ao notificar admins:', notifyError);
    }
  } catch (error) {
    console.error('Erro ao recorrer devolucao:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao recorrer devolucao',
    });
  }
};

module.exports = {
  criarDevolucao,
  listarDevolucoes,
  obterDevolucao,
  atualizarStatus,
  recorrerDevolucao,
};
