const { pool } = require('../config/database');

// POST /api/pedidos - Criar novo pedido
const criarPedido = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.usuario.id;
    const {
      itens,
      endereco_entrega_id,
      forma_pagamento,
      cupom_codigo,
    } = req.body;

    // Validação básica
    if (!itens || itens.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Carrinho vazio',
      });
    }

    if (!endereco_entrega_id) {
      return res.status(400).json({
        success: false,
        error: 'Endereço de entrega é obrigatório',
      });
    }

    if (!forma_pagamento) {
      return res.status(400).json({
        success: false,
        error: 'Forma de pagamento é obrigatória',
      });
    }

    // Iniciar transação
    await client.query('BEGIN');

    // Verificar se endereço pertence ao usuário
    const enderecoResult = await client.query(
      'SELECT id FROM enderecos WHERE id = $1 AND usuario_id = $2',
      [endereco_entrega_id, userId]
    );

    if (enderecoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Endereço inválido',
      });
    }

    // Calcular totais e verificar estoque
    let subtotal = 0;
    const itensValidados = [];

    for (const item of itens) {
      const { produto_id, quantidade, tamanho, cor } = item;

      // Buscar produto
      const produtoResult = await client.query(
        'SELECT id, nome, preco, estoque, ativo FROM produtos WHERE id = $1',
        [produto_id]
      );

      if (produtoResult.rows.length === 0 || !produtoResult.rows[0].ativo) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Produto ${produto_id} não encontrado ou indisponível`,
        });
      }

      const produto = produtoResult.rows[0];

      // Verificar estoque
      if (produto.estoque < quantidade) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoque}`,
        });
      }

      const preco_unitario = parseFloat(produto.preco);
      const subtotal_item = preco_unitario * quantidade;
      subtotal += subtotal_item;

      itensValidados.push({
        produto_id,
        quantidade,
        preco_unitario,
        subtotal: subtotal_item,
        tamanho,
        cor,
      });

      // Atualizar estoque
      await client.query(
        'UPDATE produtos SET estoque = estoque - $1, vendas_total = vendas_total + $2 WHERE id = $3',
        [quantidade, quantidade, produto_id]
      );
    }

    // Aplicar cupom se fornecido
    let desconto = 0;
    if (cupom_codigo) {
      const cupomResult = await client.query(
        `SELECT * FROM cupons 
         WHERE codigo = $1 AND ativo = true 
         AND (data_validade IS NULL OR data_validade >= NOW())
         AND (usos_maximos IS NULL OR usos_atuais < usos_maximos)`,
        [cupom_codigo]
      );

      if (cupomResult.rows.length > 0) {
        const cupom = cupomResult.rows[0];
        
        if (cupom.tipo_desconto === 'percentual') {
          desconto = (subtotal * cupom.valor_desconto) / 100;
        } else {
          desconto = cupom.valor_desconto;
        }

        // Atualizar uso do cupom
        await client.query(
          'UPDATE cupons SET usos_atuais = usos_atuais + 1 WHERE id = $1',
          [cupom.id]
        );
      }
    }

    // Calcular frete (mock - valor fixo)
    const frete = 15.00;

    // Calcular total
    const total = subtotal - desconto + frete;

    // Criar pedido
    const pedidoResult = await client.query(
      `INSERT INTO pedidos 
       (usuario_id, status, subtotal, desconto, frete, total, forma_pagamento, endereco_entrega_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, 'pendente', subtotal, desconto, frete, total, forma_pagamento, endereco_entrega_id]
    );

    const pedido = pedidoResult.rows[0];

    // Inserir itens do pedido
    for (const item of itensValidados) {
      await client.query(
        `INSERT INTO itens_pedido 
         (pedido_id, produto_id, quantidade, preco_unitario, subtotal, tamanho, cor)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          pedido.id,
          item.produto_id,
          item.quantidade,
          item.preco_unitario,
          item.subtotal,
          item.tamanho,
          item.cor,
        ]
      );
    }

    // Commit da transação
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Pedido criado com sucesso',
      data: {
        ...pedido,
        itens: itensValidados,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar pedido',
    });
  } finally {
    client.release();
  }
};

// GET /api/pedidos - Listar pedidos do usuário ou todos (admin)
const listarPedidos = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const isAdmin = req.usuario.is_admin;
    const { status, limite = 20, pagina = 1 } = req.query;
    const offset = (pagina - 1) * limite;

    let query = `
      SELECT p.*, 
             p.total as valor_total,
             e.rua, e.numero, e.bairro, e.cidade, e.estado,
             u.nome as usuario_nome, u.email as usuario_email,
             COUNT(DISTINCT ip.id) as total_itens
      FROM pedidos p
      LEFT JOIN enderecos e ON p.endereco_entrega_id = e.id
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN itens_pedido ip ON p.id = ip.pedido_id
    `;
    
    const params = [];
    let paramCount = 1;
    
    // Se não for admin, filtrar por usuário
    if (!isAdmin) {
      query += ` WHERE p.usuario_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    } else {
      query += ` WHERE 1=1`;
    }

    if (status) {
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` GROUP BY p.id, e.id, u.id ORDER BY p.data_pedido DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limite, offset);

    const result = await pool.query(query, params);

    // Contar total
    let countQuery = 'SELECT COUNT(*) FROM pedidos';
    const countParams = [];
    let countParamCount = 1;
    
    if (!isAdmin) {
      countQuery += ' WHERE usuario_id = $' + countParamCount;
      countParams.push(userId);
      countParamCount++;
      
      if (status) {
        countQuery += ' AND status = $' + countParamCount;
        countParams.push(status);
      }
    } else {
      if (status) {
        countQuery += ' WHERE status = $' + countParamCount;
        countParams.push(status);
      }
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      count: result.rows.length,
      total: parseInt(countResult.rows[0].count),
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(countResult.rows[0].count / limite),
      data: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar pedidos',
    });
  }
};

// GET /api/pedidos/:id - Obter pedido específico
const obterPedido = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const isAdmin = req.usuario.is_admin;
    const { id } = req.params;

    // Buscar pedido
    let query = `
      SELECT p.*, 
             e.cep, e.rua, e.numero, e.complemento, e.bairro, e.cidade, e.estado,
             u.nome as usuario_nome, u.email as usuario_email, u.telefone as usuario_telefone
      FROM pedidos p
      LEFT JOIN enderecos e ON p.endereco_entrega_id = e.id
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.id = $1
    `;
    const params = [id];

    // Se não for admin, só pode ver próprios pedidos
    if (!isAdmin) {
      query += ' AND p.usuario_id = $2';
      params.push(userId);
    }

    const pedidoResult = await pool.query(query, params);

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pedido não encontrado',
      });
    }

    const pedido = pedidoResult.rows[0];

    // Buscar itens do pedido
    const itensResult = await pool.query(
      `SELECT ip.*, p.nome as produto_nome, p.imagens as produto_imagens
       FROM itens_pedido ip
       LEFT JOIN produtos p ON ip.produto_id = p.id
       WHERE ip.pedido_id = $1`,
      [id]
    );

    pedido.itens = itensResult.rows;

    res.json({
      success: true,
      data: pedido,
    });
  } catch (error) {
    console.error('Erro ao obter pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar pedido',
    });
  }
};

// PUT /api/pedidos/:id/status - Atualizar status do pedido (admin)
const atualizarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const statusPermitidos = ['pendente', 'pago', 'processando', 'enviado', 'entregue', 'cancelado'];
    
    if (!status || !statusPermitidos.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status inválido. Use: ${statusPermitidos.join(', ')}`,
      });
    }

    const result = await pool.query(
      'UPDATE pedidos SET status = $1, data_atualizacao = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pedido não encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Status atualizado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar status',
    });
  }
};

// PUT /api/pedidos/:id/rastreio - Adicionar código de rastreio (admin)
const adicionarRastreio = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo_rastreio } = req.body;

    if (!codigo_rastreio) {
      return res.status(400).json({
        success: false,
        error: 'Código de rastreio é obrigatório',
      });
    }

    const result = await pool.query(
      `UPDATE pedidos 
       SET codigo_rastreio = $1, status = 'enviado', data_atualizacao = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [codigo_rastreio, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pedido não encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Código de rastreio adicionado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao adicionar rastreio:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao adicionar rastreio',
    });
  }
};

// POST /api/pedidos/:id/cancelar - Cancelar pedido
const cancelarPedido = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.usuario.id;
    const { id } = req.params;

    await client.query('BEGIN');

    // Verificar se pedido pertence ao usuário e pode ser cancelado
    const pedidoResult = await client.query(
      'SELECT * FROM pedidos WHERE id = $1 AND usuario_id = $2',
      [id, userId]
    );

    if (pedidoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Pedido não encontrado',
      });
    }

    const pedido = pedidoResult.rows[0];

    // Verificar se pode cancelar
    // Permitir cancelamento apenas para: pendente, processando, pago
    if (!['pendente', 'processando', 'pago'].includes(pedido.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Pedido não pode ser cancelado no status '${pedido.status}'. Apenas pedidos pendentes, processando ou pagos podem ser cancelados.`,
      });
    }

    // Devolver produtos ao estoque
    const itensResult = await client.query(
      'SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = $1',
      [id]
    );

    for (const item of itensResult.rows) {
      await client.query(
        'UPDATE produtos SET estoque = estoque + $1, vendas_total = vendas_total - $2 WHERE id = $3',
        [item.quantidade, item.quantidade, item.produto_id]
      );
    }

    // Atualizar status do pedido
    const result = await client.query(
      'UPDATE pedidos SET status = $1, data_atualizacao = NOW() WHERE id = $2 RETURNING *',
      ['cancelado', id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Pedido cancelado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao cancelar pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao cancelar pedido',
    });
  } finally {
    client.release();
  }
};

// GET /api/pedidos/:id/rastreamento - Obter informações de rastreamento
const obterRastreamento = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const isAdmin = req.usuario.is_admin;
    const { id } = req.params;

    let query = `
      SELECT p.id, p.status, p.codigo_rastreio, p.data_pedido, p.data_atualizacao
      FROM pedidos p
      WHERE p.id = $1
    `;
    const params = [id];

    // Se não for admin, só pode ver próprios pedidos
    if (!isAdmin) {
      query += ' AND p.usuario_id = $2';
      params.push(userId);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pedido não encontrado',
      });
    }

    const pedido = result.rows[0];

    if (!pedido.codigo_rastreio) {
      return res.json({
        success: true,
        data: {
          status: pedido.status,
          mensagem: 'Pedido ainda não foi enviado',
        },
      });
    }

    res.json({
      success: true,
      data: {
        codigo_rastreio: pedido.codigo_rastreio,
        status: pedido.status,
        data_envio: pedido.data_atualizacao,
        url_rastreamento: `https://www.correios.com.br/rastreamento?codigo=${pedido.codigo_rastreio}`,
      },
    });
  } catch (error) {
    console.error('Erro ao obter rastreamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar informações de rastreamento',
    });
  }
};

module.exports = {
  criarPedido,
  listarPedidos,
  obterPedido,
  obterRastreamento,
  atualizarStatus,
  adicionarRastreio,
  cancelarPedido,
};
