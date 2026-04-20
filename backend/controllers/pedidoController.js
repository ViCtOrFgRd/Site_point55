const { pool } = require('../config/database');
const crypto = require('crypto');
const { obterPromocoesAtivas, aplicarPromocaoProduto } = require('../utils/promocoes');
const {
  calcularFreteSuperfrete,
  obterPedidoSuperfrete,
  obterLinkEtiquetaSuperfrete,
  cancelarPedidoSuperfrete,
} = require('../services/superfreteService');
const {
  buscarPedidoParaEtiqueta,
  extractSuperfreteInfo,
  isSuperfreteLabelReady,
  criarEtiquetaPedido,
  pagarEtiquetaPedido,
} = require('../services/pedidoEtiquetaService');
const {
  createCustomer,
  createPayment,
  getPayment,
  getPixQrCode,
  cancelPayment,
  refundPayment,
} = require('../services/asaasService');
const { notifyAdmins, notifyUser } = require('../services/notificationService');
const {
  enviarEmailCodigoRetirada,
  enviarEmailConfirmacaoPagamento,
  enviarEmailCancelamentoPedidoReembolso,
} = require('../services/emailService');
const {
  ensureRetiradaCodigoTable,
  saveRetiradaCodigo,
  getRetiradaCodigo,
} = require('../services/retiradaCodigoService');

const parseNumber = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const parsed = Number.parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const roundMoney = (value) => {
  const parsed = parseNumber(value) ?? 0;
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
};

// Função para serializar pedido corretamente (convertendo DATE columns para strings)
const serializarPedido = (pedido) => {
  if (!pedido) return pedido;
  
  const serializado = { ...pedido };
  
  // Converter DATE columns (date-only) para string YYYY-MM-DD
  if (serializado.asaas_due_date instanceof Date) {
    // Extrair apenas a data em local time
    const year = serializado.asaas_due_date.getFullYear();
    const month = String(serializado.asaas_due_date.getMonth() + 1).padStart(2, '0');
    const day = String(serializado.asaas_due_date.getDate()).padStart(2, '0');
    serializado.asaas_due_date = `${year}-${month}-${day}`;
  }

  if (serializado.retirada_prazo_vencimento instanceof Date) {
    const year = serializado.retirada_prazo_vencimento.getFullYear();
    const month = String(serializado.retirada_prazo_vencimento.getMonth() + 1).padStart(2, '0');
    const day = String(serializado.retirada_prazo_vencimento.getDate()).padStart(2, '0');
    serializado.retirada_prazo_vencimento = `${year}-${month}-${day}`;
  }
  
  return serializado;
};

const formatDateYMD = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const gerarCodigoRetirada = (pagamentoNaRetirada) => {
  const prefixo = pagamentoNaRetirada ? '01' : '11';
  const random = crypto.randomInt(0, 1000000);
  const sufixo = String(random).padStart(6, '0');
  return `${prefixo}${sufixo}`;
};

const STATUS_ASAAS_PAGO = new Set(['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH']);
const STATUS_ASAAS_REEMBOLSADO = new Set(['REFUNDED', 'PARTIALLY_REFUNDED']);
const STATUS_ASAAS_ESTORNO_API = new Set(['CONFIRMED', 'RECEIVED']);
const STATUS_RETIRADA_AGUARDANDO = new Set(['pendente_pagamento_retirada', 'aguardando_pagamento_retirada']);
const STATUS_RETIRADA = new Set(['pendente_pagamento_retirada', 'aguardando_pagamento_retirada', 'pronto_para_retirada', 'retirado']);

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const ensureReembolsoQueueTable = async (dbClient = pool) => {
  await dbClient.query(`
    CREATE TABLE IF NOT EXISTS pedidos_reembolso_admin (
      id SERIAL PRIMARY KEY,
      pedido_id INTEGER NOT NULL UNIQUE REFERENCES pedidos(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'pendente',
      motivo VARCHAR(50) NOT NULL,
      observacao TEXT,
      erro TEXT,
      criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
      atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
      processado_em TIMESTAMP NULL
    )
  `);

  await dbClient.query(
    'CREATE INDEX IF NOT EXISTS idx_reembolso_admin_status ON pedidos_reembolso_admin(status)'
  );
};

const registrarReembolsoPendente = async (dbClient, pedidoId, motivo, erro = null) => {
  await ensureReembolsoQueueTable(dbClient);

  await dbClient.query(
    `INSERT INTO pedidos_reembolso_admin (pedido_id, status, motivo, erro, atualizado_em)
     VALUES ($1, 'pendente', $2, $3, NOW())
     ON CONFLICT (pedido_id)
     DO UPDATE SET
       status = 'pendente',
       motivo = EXCLUDED.motivo,
       erro = EXCLUDED.erro,
       atualizado_em = NOW(),
       processado_em = NULL`,
    [pedidoId, motivo, erro]
  );
};

const marcarReembolsoConcluido = async (dbClient, pedidoId, observacao = null) => {
  await ensureReembolsoQueueTable(dbClient);

  await dbClient.query(
    `UPDATE pedidos_reembolso_admin
     SET status = 'concluido',
         observacao = COALESCE($2, observacao),
         erro = NULL,
         atualizado_em = NOW(),
         processado_em = NOW()
     WHERE pedido_id = $1`,
    [pedidoId, observacao]
  );
};

const resolveEnableGetPaymentSyncFallback = () => {
  const raw = String(process.env.ASAAS_ENABLE_GET_PAYMENT_SYNC || '').trim().toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return process.env.NODE_ENV !== 'production';
};

const ENABLE_GET_PAYMENT_SYNC_FALLBACK = resolveEnableGetPaymentSyncFallback();

const isRetiradaLocalPedido = (pedido) => {
  const entregaTipo = String(pedido?.entrega_tipo || '').toLowerCase().trim();
  if (['retirada_local', 'retirada no local', 'retirada-no-local', 'retirada', 'retirar_no_local'].includes(entregaTipo)) {
    return true;
  }

  const status = String(pedido?.status || '').toLowerCase().trim();
  if (STATUS_RETIRADA.has(status)) {
    return true;
  }

  return Boolean(pedido?.pagamento_na_retirada);
};

const hashCodigoRetirada = (codigo) => {
  return crypto.createHash('sha256').update(String(codigo)).digest('hex');
};

const garantirCodigoRetirada = async (pedidoBase) => {
  if (!pedidoBase || !isRetiradaLocalPedido(pedidoBase) || pedidoBase.pagamento_na_retirada) {
    return null;
  }

  const pagamentoConfirmado = STATUS_ASAAS_PAGO.has(String(pedidoBase.asaas_payment_status || '').toUpperCase());
  if (!pagamentoConfirmado) {
    return null;
  }

  let codigoRetirada = await getRetiradaCodigo(pool, pedidoBase.id);
  let codigoNovoGerado = false;

  if (!codigoRetirada) {
    codigoRetirada = gerarCodigoRetirada(Boolean(pedidoBase.pagamento_na_retirada));
    await saveRetiradaCodigo(pool, pedidoBase.id, codigoRetirada);
    codigoNovoGerado = true;

    await pool.query(
      `UPDATE pedidos
       SET retirada_codigo_hash = $1,
           retirada_codigo_gerado_em = COALESCE(retirada_codigo_gerado_em, NOW()),
           retirada_prazo_vencimento = COALESCE(retirada_prazo_vencimento, CURRENT_DATE + INTERVAL '7 days')
       WHERE id = $2`,
      [hashCodigoRetirada(codigoRetirada), pedidoBase.id]
    );

    if (!pedidoBase.retirada_prazo_vencimento) {
      pedidoBase.retirada_prazo_vencimento = formatDateYMD(addDays(new Date(), 7));
    }

    const configResult = await pool.query(
      'SELECT * FROM retirada_config WHERE ativo = true ORDER BY id DESC LIMIT 1'
    );

    const config = configResult.rows[0] || {
      nome_local: 'Shopping Jequitibas',
      endereco: 'Av. Jequitibas, 1234',
      horario_segunda_sabado: '10:00-17:00',
    };

    if (pedidoBase.usuario_email) {
      await enviarEmailCodigoRetirada(pedidoBase.usuario_email, {
        pedido_id: pedidoBase.id,
        nome: pedidoBase.usuario_nome,
        codigo: codigoRetirada,
        data_limite: pedidoBase.retirada_prazo_vencimento || formatDateYMD(addDays(new Date(), 7)),
        local: config.nome_local,
        endereco: config.endereco,
        horario: config.horario_segunda_sabado,
      });
    }
  }

  return {
    codigo: codigoRetirada,
    novo: codigoNovoGerado,
  };
};

const baixarEstoquePorConfirmacaoPagamento = async (pedidoId) => {
  try {
    const itensResult = await pool.query(
      'SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = $1',
      [pedidoId]
    );

    for (const item of itensResult.rows) {
      const estoqueResult = await pool.query(
        `UPDATE produtos
         SET estoque = estoque - $1, vendas_total = vendas_total + $2
         WHERE id = $3 AND estoque >= $1
         RETURNING estoque, nome`,
        [item.quantidade, item.quantidade, item.produto_id]
      );

      if (estoqueResult.rowCount > 0) {
        const estoqueAtualizado = estoqueResult.rows[0].estoque;
        const nomeProduto = estoqueResult.rows[0].nome;

        if (estoqueAtualizado === 0) {
          await pool.query(
            'UPDATE produtos SET ativo = false WHERE id = $1',
            [item.produto_id]
          );

          notifyAdmins({
            tipoEvento: 'estoque_zerado',
            titulo: '⚠️ Produto sem estoque',
            mensagem: `O produto "${nomeProduto}" ficou com estoque zerado e foi inativado automaticamente.`,
            payload: {
              produto_id: item.produto_id,
              produto_nome: nomeProduto,
              estoque_anterior: item.quantidade,
              estoque_atual: 0,
            },
          }).catch((err) => console.error('Erro ao notificar admins sobre estoque:', err));
        }
      } else {
        console.error(`⚠️ Não foi possível reduzir estoque do produto #${item.produto_id} - estoque insuficiente`);
      }
    }
  } catch (estoqueError) {
    console.error('❌ Erro ao atualizar estoque após confirmação de pagamento:', estoqueError);
  }
};

const mascararCodigoRetirada = (codigo) => {
  const texto = String(codigo || '');
  if (texto.length <= 4) {
    return texto;
  }

  const inicio = texto.slice(0, 2);
  const fim = texto.slice(-2);
  return `${inicio}****${fim}`;
};

const normalizePhone = (value) => {
  if (!value) return undefined;
  const digits = String(value).replace(/\D/g, '');
  return digits.length >= 10 ? digits : undefined;
};

// POST /api/pedidos - Criar novo pedido
const criarPedido = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await ensureRetiradaCodigoTable(pool);

    const userId = req.usuario.id;
    const {
      itens,
      endereco_entrega_id,
      forma_pagamento,
      cupom_codigo,
      entrega_tipo,
      frete_valor,
      pagamento_na_retirada,
    } = req.body;

    // Validação básica
    if (!itens || itens.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Carrinho vazio',
      });
    }

    if (!forma_pagamento) {
      return res.status(400).json({
        success: false,
        error: 'Forma de pagamento é obrigatória',
      });
    }

    const pagamentoNaRetirada = Boolean(pagamento_na_retirada) || ['retirada', 'local'].includes(String(forma_pagamento).toLowerCase());
    const entregaTipo = pagamentoNaRetirada ? 'retirada_local' : String(entrega_tipo || 'entrega');
    const isRetiradaLocal = entregaTipo === 'retirada_local';
    const precisaEnderecoEntrega = !isRetiradaLocal || !pagamentoNaRetirada;

    if (precisaEnderecoEntrega && !endereco_entrega_id) {
      return res.status(400).json({
        success: false,
        error: 'Endereço de entrega é obrigatório',
      });
    }

    // Iniciar transação
    await client.query('BEGIN');

    let endereco = null;
    if (precisaEnderecoEntrega) {
      const enderecoResult = await client.query(
        'SELECT id, cep FROM enderecos WHERE id = $1 AND usuario_id = $2',
        [endereco_entrega_id, userId]
      );

      if (enderecoResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Endereço inválido',
        });
      }

      endereco = enderecoResult.rows[0];
    }

    const promocoesAtivas = await obterPromocoesAtivas(client);

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

      const produtoComPromocao = aplicarPromocaoProduto(
        {
          id: produto.id,
          preco: produto.preco,
          preco_original: produto.preco_original,
        },
        promocoesAtivas
      );

      const precoAplicado = parseFloat(produtoComPromocao?.preco ?? produto.preco);
      const precoBase = Number.isNaN(precoAplicado) ? parseFloat(produto.preco) : precoAplicado;
      const preco_unitario = roundMoney(precoBase);
      const subtotal_item = roundMoney(preco_unitario * quantidade);
      subtotal = roundMoney(subtotal + subtotal_item);

      itensValidados.push({
        produto_id,
        quantidade,
        preco_unitario,
        subtotal: subtotal_item,
        tamanho,
        cor,
      });

      // APENAS VERIFICAR estoque disponível (NÃO reduzir ainda)
      // Estoque será reduzido apenas quando pagamento for confirmado
      if (produto.estoque < quantidade) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoque}`,
        });
      }
    }

    // Aplicar cupom se fornecido
    let desconto = 0;
    let cupomUsado = null;
    const cupomCodigo = cupom_codigo ? cupom_codigo.toUpperCase() : null;

    if (cupomCodigo) {
      const cupomResult = await client.query(
        `SELECT * FROM cupons 
         WHERE codigo = $1 AND ativo = true 
         AND (data_validade IS NULL OR data_validade >= NOW())
         AND (usos_maximos IS NULL OR usos_atuais < usos_maximos)`,
        [cupomCodigo]
      );

      if (cupomResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Cupom invalido',
        });
      }

      const cupom = cupomResult.rows[0];

      if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Cupom invalido',
        });
      }

      if (cupom.usos_maximos && cupom.usos_atuais >= cupom.usos_maximos) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Cupom esgotado',
        });
      }

      const jaUsouResult = await client.query(
        `SELECT id FROM cupons_usuarios 
         WHERE cupom_id = $1 AND usuario_id = $2`,
        [cupom.id, userId]
      );

      if (jaUsouResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Ja utilizado',
        });
      }

      if (cupom.valor_minimo && subtotal < parseFloat(cupom.valor_minimo)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Cupom invalido',
        });
      }

      if (cupom.tipo_desconto === 'percentual') {
        desconto = roundMoney((subtotal * (parseNumber(cupom.valor_desconto) ?? 0)) / 100);
      } else {
        desconto = roundMoney(cupom.valor_desconto);
      }

      if (desconto > subtotal) {
        desconto = subtotal;
      }

      cupomUsado = cupom;
    }

    const fretePadrao = Number.parseFloat(process.env.FRETE_PADRAO || '15');
    const freteGratisAcima = Number.parseFloat(process.env.FRETE_GRATIS_ACIMA || '200');

    // Calcular frete (SuperFrete com fallback)
    let frete = 0;
    const freteInformadoCheckout = parseNumber(frete_valor);
    if (!isRetiradaLocal) {
      frete = roundMoney(Number.isFinite(fretePadrao) ? fretePadrao : 15.0);

      if (Number.isFinite(freteGratisAcima) && subtotal >= freteGratisAcima) {
        frete = 0;
      } else if (endereco) {
        try {
          const cotacao = await calcularFreteSuperfrete({
            cepDestino: endereco.cep,
            valorDeclarado: subtotal,
          });

          if (cotacao?.best?.valor !== null && cotacao?.best?.valor !== undefined) {
            const freteCalculado = parseNumber(cotacao.best.valor);
            if (freteCalculado !== null) {
              frete = roundMoney(freteCalculado);
            }
          }
        } catch (error) {
          console.error('Erro ao calcular frete no SuperFrete:', error?.response?.data || error.message || error);
        }
      }

      if (freteInformadoCheckout !== null && freteInformadoCheckout >= 0) {
        const freteServidor = roundMoney(frete);
        const freteCliente = roundMoney(freteInformadoCheckout);
        frete = roundMoney(Math.max(freteServidor, freteCliente));

        if (freteCliente !== freteServidor) {
          console.info('[PEDIDO] Divergencia de frete entre checkout e servidor', {
            freteCheckout: freteCliente,
            freteServidor,
            freteAplicado: frete,
          });
        }
      }
    }

    // Calcular total
    desconto = roundMoney(desconto);
    frete = roundMoney(frete);
    const total = roundMoney(subtotal - desconto + frete);

    let statusInicial = 'pendente';
    let retiradaCodigo = null;
    let retiradaCodigoHash = null;
    let retiradaGeradoEm = null;
    let retiradaPrazo = null;

    if (isRetiradaLocal) {
      statusInicial = pagamentoNaRetirada ? 'pronto_para_retirada' : 'pendente_pagamento_retirada';
      if (pagamentoNaRetirada) {
        retiradaCodigo = gerarCodigoRetirada(pagamentoNaRetirada);
        retiradaCodigoHash = hashCodigoRetirada(retiradaCodigo);
        retiradaGeradoEm = new Date();
        retiradaPrazo = formatDateYMD(addDays(new Date(), 7));
      }
    }

    // Criar pedido
    const pedidoResult = await client.query(
      `INSERT INTO pedidos 
       (usuario_id, status, subtotal, desconto, frete, total, forma_pagamento, endereco_entrega_id, cupom_codigo,
        entrega_tipo, retirada_codigo_hash, retirada_codigo_gerado_em, retirada_prazo_vencimento, pagamento_na_retirada)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        userId,
        statusInicial,
        roundMoney(subtotal),
        roundMoney(desconto),
        roundMoney(frete),
        roundMoney(total),
        forma_pagamento,
        endereco_entrega_id || null,
        cupomCodigo,
        entregaTipo,
        retiradaCodigoHash,
        retiradaGeradoEm,
        retiradaPrazo,
        pagamentoNaRetirada,
      ]
    );

    const pedido = pedidoResult.rows[0];

    if (retiradaCodigo) {
      await saveRetiradaCodigo(client, pedido.id, retiradaCodigo);
    }

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

    if (isRetiradaLocal && pagamentoNaRetirada) {
      for (const item of itensValidados) {
        await client.query(
          `UPDATE produtos
           SET estoque = estoque - $1
           WHERE id = $2 AND estoque >= $1`,
          [item.quantidade, item.produto_id]
        );
      }
    }

    if (cupomUsado) {
      await client.query(
        'UPDATE cupons SET usos_atuais = usos_atuais + 1 WHERE id = $1',
        [cupomUsado.id]
      );

      await client.query(
        `INSERT INTO cupons_usuarios (cupom_id, usuario_id, pedido_id)
         VALUES ($1, $2, $3)`,
        [cupomUsado.id, userId, pedido.id]
      );
    }

    // Commit da transação
    await client.query('COMMIT');

    let pedidoAtualizado = pedido;
    const precisaPagamento = ['pix', 'boleto', 'cartao'].includes(String(forma_pagamento)) && !pagamentoNaRetirada;

    if (precisaPagamento) {
      try {
        const usuarioResult = await pool.query(
          'SELECT nome, email, cpf, telefone FROM usuarios WHERE id = $1',
          [userId]
        );
        const usuario = usuarioResult.rows[0] || {};

        const enderecoCompleto = await pool.query(
          'SELECT * FROM enderecos WHERE id = $1',
          [endereco_entrega_id]
        );
        const enderecoEntrega = enderecoCompleto.rows[0] || {};

        const billingTypeMap = {
          pix: 'PIX',
          boleto: 'BOLETO',
          cartao: 'CREDIT_CARD',
        };

        const billingType = billingTypeMap[forma_pagamento] || 'PIX';
        const dueDate = new Date();
        if (billingType === 'BOLETO') {
          dueDate.setDate(dueDate.getDate() + 3);
        }

        const customerPayload = {
          name: usuario.nome || `Cliente ${userId}`,
          email: usuario.email,
          cpfCnpj: usuario.cpf || undefined,
          mobilePhone: normalizePhone(usuario.telefone),
          postalCode: enderecoEntrega.cep,
          address: enderecoEntrega.rua,
          addressNumber: enderecoEntrega.numero,
          complement: enderecoEntrega.complemento || undefined,
          province: enderecoEntrega.bairro,
          city: enderecoEntrega.cidade,
          state: enderecoEntrega.estado,
        };

        const customer = await createCustomer(customerPayload);

        const valorCobranca = roundMoney(parseNumber(pedido.total) ?? total);

        const paymentPayload = {
          customer: customer.id,
          billingType,
          value: valorCobranca,
          dueDate: formatDateYMD(dueDate),
          description: `Pedido #${pedido.id}`,
          externalReference: `pedido-${pedido.id}`,
        };

        console.info('[ASAAS] Criando cobranca', {
          pedidoId: pedido.id,
          subtotal: roundMoney(subtotal),
          desconto: roundMoney(desconto),
          frete: roundMoney(frete),
          totalPedido: roundMoney(total),
          valorCobranca,
          billingType,
        });

        const payment = await createPayment(paymentPayload);

        let pixInfo = null;
        if (billingType === 'PIX') {
          pixInfo = await getPixQrCode(payment.id);
        }

        const updateResult = await pool.query(
          `UPDATE pedidos
           SET asaas_customer_id = $1,
               asaas_payment_id = $2,
               asaas_payment_status = $3,
               asaas_billing_type = $4,
               asaas_due_date = $5,
               asaas_invoice_url = $6,
               asaas_boleto_url = $7,
               asaas_pix_qr_code = $8,
               asaas_pix_payload = $9
           WHERE id = $10
           RETURNING *`,
          [
            customer.id,
            payment.id,
            payment.status || null,
            billingType,
            payment.dueDate || formatDateYMD(dueDate),
            payment.invoiceUrl || null,
            payment.bankSlipUrl || payment.boletoUrl || null,
            pixInfo?.encodedImage || pixInfo?.qrCode || null,
            pixInfo?.payload || pixInfo?.copyPaste || null,
            pedido.id,
          ]
        );

        if (updateResult.rows.length > 0) {
          pedidoAtualizado = updateResult.rows[0];
        }
      } catch (paymentError) {
        const asaasErrors = Array.isArray(paymentError?.response?.data?.errors)
          ? paymentError.response.data.errors
          : [];

        const asaasErrorCode = asaasErrors[0]?.code || null;
        const asaasErrorDescription = asaasErrors[0]?.description || null;

        console.error('Erro ao gerar pagamento Asaas:', {
          status: paymentError?.response?.status || null,
          code: asaasErrorCode,
          description: asaasErrorDescription,
          payload: paymentError?.response?.data || paymentError.message || paymentError,
        });

        if (asaasErrorCode === 'invalid_access_token') {
          return res.status(502).json({
            success: false,
            error: 'Falha de autenticação com provedor de pagamento. Verifique o token Asaas.',
            code: 'asaas_invalid_access_token',
          });
        }

        if (billingType === 'PIX' && asaasErrorCode === 'invalid_billingType') {
          return res.status(400).json({
            success: false,
            error: 'Pagamento via PIX indisponível no momento. Conta Asaas ainda não habilitada para PIX em produção.',
            code: 'asaas_pix_unavailable',
          });
        }

        return res.status(502).json({
          success: false,
          error: 'Erro ao gerar pagamento. Tente novamente.',
          code: 'asaas_payment_error',
        });
      }
    }

    try {
      await notifyAdmins({
        tipoEvento: 'pedido_novo',
        titulo: 'Novo pedido',
        mensagem: `Pedido #${pedido.id} criado pelo usuario ${userId}.`,
        payload: {
          pedido_id: pedido.id,
          usuario_id: userId,
        },
      });
    } catch (notifyError) {
      console.error('Erro ao notificar admins:', notifyError);
    }

    if (retiradaCodigo) {
      try {
        const usuarioResult = await pool.query(
          'SELECT nome, email FROM usuarios WHERE id = $1',
          [userId]
        );
        const usuario = usuarioResult.rows[0] || {};

        const configResult = await pool.query(
          'SELECT * FROM retirada_config WHERE ativo = true ORDER BY id DESC LIMIT 1'
        );

        const config = configResult.rows[0] || {
          nome_local: 'Shopping Jequitibas',
          endereco: 'Av. Jequitibas, 1234',
          horario_segunda_sabado: '10:00-17:00',
        };

        if (usuario.email) {
          await enviarEmailCodigoRetirada(usuario.email, {
            pedido_id: pedido.id,
            nome: usuario.nome,
            codigo: retiradaCodigo,
            data_limite: retiradaPrazo,
            local: config.nome_local,
            endereco: config.endereco,
            horario: config.horario_segunda_sabado,
          });
        }
      } catch (emailError) {
        console.error('Erro ao enviar email de retirada:', emailError);
      }
    }

    // Serializar pedido antes de enviar (converter DATE columns para strings)
    pedidoAtualizado = serializarPedido(pedidoAtualizado);

    const responseData = {
      ...pedidoAtualizado,
      itens: itensValidados,
    };

    if (retiradaCodigo) {
      responseData.retirada_codigo = retiradaCodigo;
    }

    res.status(201).json({
      success: true,
      message: 'Pedido criado com sucesso',
      data: responseData,
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
    await ensureRetiradaCodigoTable(pool);

    const userId = req.usuario.id;
    const isAdmin = req.usuario.is_admin;
    const { status, limite = 20, pagina = 1 } = req.query;
    const offset = (pagina - 1) * limite;

    let query = `
      SELECT p.*, 
             p.total as valor_total,
              MAX(rc.codigo) as retirada_codigo,
             e.rua, e.numero, e.bairro, e.cidade, e.estado,
             u.nome as usuario_nome, u.email as usuario_email,
             COUNT(DISTINCT ip.id) as total_itens
      FROM pedidos p
      LEFT JOIN enderecos e ON p.endereco_entrega_id = e.id
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN itens_pedido ip ON p.id = ip.pedido_id
            LEFT JOIN retirada_codigos rc ON rc.pedido_id = p.id
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

    const serializedPedidos = result.rows.map(serializarPedido);

    res.json({
      success: true,
      count: serializedPedidos.length,
      total: parseInt(countResult.rows[0].count),
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(countResult.rows[0].count / limite),
      data: serializedPedidos,
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
    await ensureRetiradaCodigoTable(pool);

    const userId = req.usuario.id;
    const isAdmin = req.usuario.is_admin;
    const { id } = req.params;

    // Buscar pedido
    let query = `
      SELECT p.*, 
              rc.codigo as retirada_codigo,
             e.cep, e.rua, e.numero, e.complemento, e.bairro, e.cidade, e.estado,
             u.nome as usuario_nome, u.email as usuario_email, u.telefone as usuario_telefone
      FROM pedidos p
      LEFT JOIN enderecos e ON p.endereco_entrega_id = e.id
      LEFT JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN retirada_codigos rc ON rc.pedido_id = p.id
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

    let pedido = pedidoResult.rows[0];

    const asaasStatusAtual = String(pedido.asaas_payment_status || '').toUpperCase();
    const pedidoAtualizadoHaPouco = pedido.data_atualizacao
      ? Date.now() - new Date(pedido.data_atualizacao).getTime() < 15000
      : false;
    const precisaSyncAsaasFallback = ENABLE_GET_PAYMENT_SYNC_FALLBACK
      && Boolean(pedido.asaas_payment_id)
      && !STATUS_ASAAS_PAGO.has(asaasStatusAtual)
      && !pedidoAtualizadoHaPouco;

    if (precisaSyncAsaasFallback) {
      try {
        const paymentInfo = await getPayment(pedido.asaas_payment_id);
        const statusAsaasRemoto = String(paymentInfo?.status || '').toUpperCase();

        if (statusAsaasRemoto && statusAsaasRemoto !== asaasStatusAtual) {
          let novoStatusPedido = pedido.status;
          const pagamentoConfirmadoAgora = STATUS_ASAAS_PAGO.has(statusAsaasRemoto);

          if (pagamentoConfirmadoAgora) {
            novoStatusPedido = isRetiradaLocalPedido(pedido) ? 'pronto_para_retirada' : 'processando';
          }

          const syncResult = await pool.query(
            `UPDATE pedidos
             SET asaas_payment_status = $1,
                 status = $2,
                 data_atualizacao = NOW()
             WHERE id = $3
               AND COALESCE(UPPER(asaas_payment_status), '') NOT IN ('CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH')
             RETURNING *`,
            [statusAsaasRemoto, novoStatusPedido, pedido.id]
          );

          if (syncResult.rows.length > 0) {
            if (pagamentoConfirmadoAgora) {
              await baixarEstoquePorConfirmacaoPagamento(pedido.id);

              if (pedido.usuario_email) {
                await enviarEmailConfirmacaoPagamento(pedido.usuario_email, {
                  id: pedido.id,
                  nome: pedido.usuario_nome,
                  email: pedido.usuario_email,
                  total: parseFloat(syncResult.rows[0].total || pedido.total || 0),
                  forma_pagamento: pedido.forma_pagamento,
                  entrega_tipo: pedido.entrega_tipo,
                }).catch((err) => {
                  console.error('Erro ao enviar email de confirmação de pagamento no fallback:', err);
                });
              }
            }

            pedido = {
              ...syncResult.rows[0],
              usuario_nome: pedido.usuario_nome,
              usuario_email: pedido.usuario_email,
              usuario_telefone: pedido.usuario_telefone,
              cep: pedido.cep,
              rua: pedido.rua,
              numero: pedido.numero,
              complemento: pedido.complemento,
              bairro: pedido.bairro,
              cidade: pedido.cidade,
              estado: pedido.estado,
              retirada_codigo: pedido.retirada_codigo,
            };
          }
        }
      } catch (syncError) {
        console.error('Falha no sync fallback Asaas em obterPedido:', syncError?.response?.data || syncError.message || syncError);
      }
    }

    const statusAtual = String(pedido.status || '').toLowerCase().trim();
    const pagamentoConfirmado = STATUS_ASAAS_PAGO.has(String(pedido.asaas_payment_status || '').toUpperCase());

    if (
      isRetiradaLocalPedido(pedido)
      && !pedido.pagamento_na_retirada
      && pagamentoConfirmado
      && STATUS_RETIRADA_AGUARDANDO.has(statusAtual)
    ) {
      const syncResult = await pool.query(
        `UPDATE pedidos
         SET status = 'pronto_para_retirada',
             data_atualizacao = NOW()
         WHERE id = $1
         RETURNING *`,
        [pedido.id]
      );

      if (syncResult.rows.length > 0) {
        pedido = {
          ...syncResult.rows[0],
          usuario_nome: pedido.usuario_nome,
          usuario_email: pedido.usuario_email,
          usuario_telefone: pedido.usuario_telefone,
          cep: pedido.cep,
          rua: pedido.rua,
          numero: pedido.numero,
          complemento: pedido.complemento,
          bairro: pedido.bairro,
          cidade: pedido.cidade,
          estado: pedido.estado,
        };
      }
    }

    if (isRetiradaLocalPedido(pedido) && !pedido.retirada_codigo) {
      const codigoInfo = await garantirCodigoRetirada(pedido);
      pedido.retirada_codigo = codigoInfo?.codigo || await getRetiradaCodigo(pool, pedido.id);
    }

    pedido = serializarPedido(pedido);

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

// POST /api/pedidos/:id/pix/refresh - Atualizar QR Code PIX
const atualizarPixQrCode = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const isAdmin = req.usuario.is_admin;
    const { id } = req.params;

    let query = `
      SELECT id, usuario_id, forma_pagamento, asaas_payment_id, asaas_billing_type
      FROM pedidos
      WHERE id = $1
    `;
    const params = [id];

    if (!isAdmin) {
      query += ' AND usuario_id = $2';
      params.push(userId);
    }

    const pedidoResult = await pool.query(query, params);

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pedido nao encontrado',
      });
    }

    const pedido = pedidoResult.rows[0];

    if (String(pedido.forma_pagamento) !== 'pix' || String(pedido.asaas_billing_type).toUpperCase() !== 'PIX') {
      return res.status(400).json({
        success: false,
        error: 'Pedido nao utiliza PIX',
      });
    }

    if (!pedido.asaas_payment_id) {
      return res.status(400).json({
        success: false,
        error: 'Pagamento PIX nao encontrado para este pedido',
      });
    }

    const pixInfo = await getPixQrCode(pedido.asaas_payment_id);
    const qrCode = pixInfo?.encodedImage || pixInfo?.qrCode || null;
    const payload = pixInfo?.payload || pixInfo?.copyPaste || null;

    if (!qrCode && !payload) {
      return res.status(502).json({
        success: false,
        error: 'Nao foi possivel gerar o QR Code PIX',
      });
    }

    const updateResult = await pool.query(
      `UPDATE pedidos
       SET asaas_pix_qr_code = $1,
           asaas_pix_payload = $2,
           data_atualizacao = NOW()
       WHERE id = $3
       RETURNING *`,
      [qrCode, payload, pedido.id]
    );

    let updatedPedido = updateResult.rows[0];
    updatedPedido = serializarPedido(updatedPedido);

    res.json({
      success: true,
      message: 'QR Code PIX atualizado com sucesso',
      data: updatedPedido,
    });
  } catch (error) {
    console.error('Erro ao atualizar QR Code PIX:', error?.response?.data || error.message || error);
    res.status(502).json({
      success: false,
      error: 'Erro ao atualizar QR Code PIX',
    });
  }
};

// PUT /api/pedidos/:id/status - Atualizar status do pedido (admin)
const atualizarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const statusPermitidos = [
      'pendente',
      'pendente_pagamento_retirada',
      'aguardando_pagamento_retirada',
      'pronto_para_retirada',
      'retirado',
      'pago',
      'processando',
      'enviado',
      'devolucao',
      'devolvido',
      'entregue',
      'cancelado',
    ];
    
    if (!status || !statusPermitidos.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status inválido. Use: ${statusPermitidos.join(', ')}`,
      });
    }

    const pedidoAtualResult = await pool.query(
      'SELECT * FROM pedidos WHERE id = $1',
      [id]
    );

    if (pedidoAtualResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pedido não encontrado',
      });
    }

    const pedidoAtual = pedidoAtualResult.rows[0];
    const pagamentoConfirmado = STATUS_ASAAS_PAGO.has(String(pedidoAtual.asaas_payment_status || '').toUpperCase());
    const isRetiradaLocal = isRetiradaLocalPedido(pedidoAtual) || STATUS_RETIRADA.has(String(status || '').toLowerCase());

    let statusFinal = status;
    if (isRetiradaLocal && !pedidoAtual.pagamento_na_retirada) {
      if (STATUS_RETIRADA_AGUARDANDO.has(statusFinal) && pagamentoConfirmado) {
        statusFinal = 'pronto_para_retirada';
      }

      if (statusFinal === 'pronto_para_retirada' && !pagamentoConfirmado) {
        return res.status(400).json({
          success: false,
          error: 'Nao e possivel marcar como pronto para retirada sem pagamento confirmado',
        });
      }
    }

    const entregaTipoFinal = isRetiradaLocal ? 'retirada_local' : (pedidoAtual.entrega_tipo || 'entrega');

    const result = await pool.query(
      `UPDATE pedidos
       SET status = $1,
           entrega_tipo = $2,
           data_atualizacao = NOW()
       WHERE id = $3
       RETURNING *`,
      [statusFinal, entregaTipoFinal, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pedido não encontrado',
      });
    }

    let pedidoAtualizado = result.rows[0];

    if (statusFinal === 'pronto_para_retirada' && isRetiradaLocal && !pedidoAtualizado.pagamento_na_retirada) {
      try {
        const usuarioResult = await pool.query(
          'SELECT nome as usuario_nome, email as usuario_email FROM usuarios WHERE id = $1',
          [pedidoAtualizado.usuario_id]
        );

        const usuario = usuarioResult.rows[0] || {};
        const codigoInfo = await garantirCodigoRetirada({
          ...pedidoAtualizado,
          usuario_nome: usuario.usuario_nome,
          usuario_email: usuario.usuario_email,
        });

        if (codigoInfo?.codigo) {
          pedidoAtualizado.retirada_codigo = codigoInfo.codigo;
        }
      } catch (retiradaError) {
        console.error('Erro ao garantir código de retirada na atualização de status:', retiradaError);
      }
    }

    res.json({
      success: true,
      message: 'Status atualizado com sucesso',
      data: pedidoAtualizado,
    });

    try {
      const pedido = result.rows[0];
      if (pedido.usuario_id) {
        await notifyUser(pedido.usuario_id, {
          tipoEvento: 'pedido_status',
          titulo: 'Status do pedido atualizado',
          mensagem: `Seu pedido #${pedido.id} agora esta em '${pedido.status}'.`,
          payload: {
            pedido_id: pedido.id,
            status: pedido.status,
          },
        });
      }
    } catch (notifyError) {
      console.error('Erro ao notificar usuario:', notifyError);
    }
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

    try {
      const pedido = result.rows[0];
      if (pedido.usuario_id) {
        await notifyUser(pedido.usuario_id, {
          tipoEvento: 'pedido_rastreio',
          titulo: 'Pedido enviado',
          mensagem: `Seu pedido #${pedido.id} foi enviado. Codigo: ${pedido.codigo_rastreio}.`,
          payload: {
            pedido_id: pedido.id,
            status: pedido.status,
            codigo_rastreio: pedido.codigo_rastreio,
          },
        });
      }
    } catch (notifyError) {
      console.error('Erro ao notificar usuario:', notifyError);
    }
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
    const formaPagamento = String(pedido.forma_pagamento || '').toLowerCase();
    const isPagamentoOnline = ['pix', 'boleto', 'cartao'].includes(formaPagamento);
    const statusPagamentoAsaas = String(pedido.asaas_payment_status || '').toUpperCase();
    const pagamentoOnlineConfirmado = isPagamentoOnline
      && Boolean(pedido.asaas_payment_id)
      && STATUS_ASAAS_PAGO.has(statusPagamentoAsaas);
    const pagamentoOnlineReembolsavelApi = isPagamentoOnline
      && Boolean(pedido.asaas_payment_id)
      && STATUS_ASAAS_ESTORNO_API.has(statusPagamentoAsaas);
    const pagamentoOnlineSemConfirmacao = isPagamentoOnline
      && Boolean(pedido.asaas_payment_id)
      && !STATUS_ASAAS_PAGO.has(statusPagamentoAsaas)
      && !STATUS_ASAAS_REEMBOLSADO.has(statusPagamentoAsaas);
    const dentroDaJanelaAutoReembolso = pedido.data_pedido
      ? (Date.now() - new Date(pedido.data_pedido).getTime()) <= TWO_HOURS_MS
      : false;

    const deveReembolsarAutomaticamente = pagamentoOnlineReembolsavelApi && dentroDaJanelaAutoReembolso;
    const deveEntrarFilaAdmin = pagamentoOnlineConfirmado && !deveReembolsarAutomaticamente;

    // Verificar se pode cancelar
    // Permitir cancelamento apenas para: pendente, processando, pago
    if (!['pendente', 'processando', 'pago', 'pronto_para_retirada', 'pendente_pagamento_retirada', 'aguardando_pagamento_retirada'].includes(pedido.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Pedido não pode ser cancelado no status '${pedido.status}'.`,
      });
    }

    // Devolver produtos ao estoque APENAS se o pedido já estava pago
    // (se estava pendente, o estoque não foi reduzido)
    const itensResult = await client.query(
      'SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = $1',
      [id]
    );

    const restaurarSemVendas = pedido.entrega_tipo === 'retirada_local' && pedido.pagamento_na_retirada === true;

    // Só restaurar estoque se pedido estava pago ou em processamento (após pagamento)
    if (['pago', 'processando'].includes(pedido.status) || restaurarSemVendas) {
      for (const item of itensResult.rows) {
        // Verificar se produto estava inativo e vai ter estoque novamente
        const produtoAntes = await client.query(
          'SELECT ativo, estoque, nome FROM produtos WHERE id = $1',
          [item.produto_id]
        );

        const estoqueAntes = produtoAntes.rows[0]?.estoque || 0;
        const estaInativo = produtoAntes.rows[0]?.ativo === false;
        const nomeProduto = produtoAntes.rows[0]?.nome || 'Produto';
        const estoqueDepois = estoqueAntes + item.quantidade;

        if (restaurarSemVendas) {
          await client.query(
            'UPDATE produtos SET estoque = estoque + $1 WHERE id = $2',
            [item.quantidade, item.produto_id]
          );
        } else {
          await client.query(
            'UPDATE produtos SET estoque = estoque + $1, vendas_total = vendas_total - $2 WHERE id = $3',
            [item.quantidade, item.quantidade, item.produto_id]
          );
        }

        // Se estava inativo por estoque zerado e agora tem estoque, reativar
        if (estaInativo && estoqueAntes === 0 && estoqueDepois > 0) {
          await client.query(
            'UPDATE produtos SET ativo = true WHERE id = $1',
            [item.produto_id]
          );

          // Notificar administradores (sem await para não bloquear a transação)
          notifyAdmins({
            tipoEvento: 'estoque_restaurado',
            titulo: '✅ Produto reativado',
            mensagem: `O produto "${nomeProduto}" teve seu estoque restaurado para ${estoqueDepois} unidade(s) e foi reativado automaticamente.`,
            payload: {
              produto_id: item.produto_id,
              produto_nome: nomeProduto,
              estoque_anterior: estoqueAntes,
              estoque_atual: estoqueDepois
            }
          }).catch(err => console.error('Erro ao notificar admins sobre estoque restaurado:', err));
        }
      }
    } else {
      console.log(`ℹ️ Pedido estava em status '${pedido.status}' - estoque não foi restaurado (não havia sido reduzido)`);
    }

    // Atualizar status do pedido
    const result = await client.query(
      'UPDATE pedidos SET status = $1, data_atualizacao = NOW() WHERE id = $2 RETURNING *',
      ['cancelado', id]
    );

    if (deveEntrarFilaAdmin) {
      const motivoFila = statusPagamentoAsaas === 'RECEIVED_IN_CASH'
        ? 'status_sem_estorno_api'
        : 'regra_cancelamento_admin';
      await registrarReembolsoPendente(client, Number(id), motivoFila);
    }

    await client.query('COMMIT');

    let reembolsoAutomatico = {
      solicitado: false,
      sucesso: false,
      mensagem: '',
    };

    let cobrancaCancelada = {
      solicitada: false,
      sucesso: false,
      mensagem: '',
    };

    if (deveReembolsarAutomaticamente) {
      reembolsoAutomatico.solicitado = true;

      try {
        const refundResult = await refundPayment(pedido.asaas_payment_id);
        const statusReembolso = String(refundResult?.status || 'REFUND_REQUESTED').toUpperCase();

        await pool.query(
          `UPDATE pedidos
           SET asaas_payment_status = $1,
               data_atualizacao = NOW()
           WHERE id = $2`,
          [statusReembolso, id]
        );

        await marcarReembolsoConcluido(pool, Number(id), 'reembolso_automatico');

        reembolsoAutomatico.sucesso = true;
        reembolsoAutomatico.mensagem = 'Reembolso automatico solicitado no Asaas com sucesso';
      } catch (refundError) {
        const erroDescricao = refundError?.response?.data
          ? JSON.stringify(refundError.response.data)
          : (refundError?.message || 'Erro ao solicitar reembolso automatico');

        await registrarReembolsoPendente(pool, Number(id), 'falha_reembolso_automatico', erroDescricao);

        reembolsoAutomatico.sucesso = false;
        reembolsoAutomatico.mensagem = 'Cancelamento concluido, mas o reembolso automatico falhou e foi enviado para fila do admin';
      }
    }

    if (pagamentoOnlineSemConfirmacao) {
      cobrancaCancelada.solicitada = true;

      try {
        await cancelPayment(pedido.asaas_payment_id);

        await pool.query(
          `UPDATE pedidos
           SET asaas_payment_status = 'DELETED',
               data_atualizacao = NOW()
           WHERE id = $1`,
          [id]
        );

        cobrancaCancelada.sucesso = true;
        cobrancaCancelada.mensagem = 'Cobranca cancelada no Asaas com sucesso';
      } catch (cancelChargeError) {
        const detalhe = cancelChargeError?.response?.data || cancelChargeError?.message || cancelChargeError;
        console.error('Erro ao cancelar cobranca no Asaas:', detalhe);

        cobrancaCancelada.sucesso = false;
        cobrancaCancelada.mensagem = 'Pedido cancelado, mas nao foi possivel cancelar a cobranca automaticamente no Asaas';
      }
    }

    try {
      const usuarioResult = await pool.query(
        'SELECT nome, email FROM usuarios WHERE id = $1',
        [pedido.usuario_id]
      );

      const usuario = usuarioResult.rows[0];
      if (usuario?.email) {
        await enviarEmailCancelamentoPedidoReembolso(usuario.email, {
          pedido_id: Number(id),
          nome: usuario.nome,
          total: Number(pedido.total || 0),
          forma_pagamento: formaPagamento,
          pagamento_online_confirmado: pagamentoOnlineConfirmado,
          pagamento_online_sem_confirmacao: pagamentoOnlineSemConfirmacao,
          dentro_prazo_automatico: dentroDaJanelaAutoReembolso,
          reembolso_automatico_solicitado: reembolsoAutomatico.solicitado,
          reembolso_automatico_sucesso: reembolsoAutomatico.sucesso,
          cobranca_cancelada_solicitada: cobrancaCancelada.solicitada,
          cobranca_cancelada_sucesso: cobrancaCancelada.sucesso,
        });
      }
    } catch (emailError) {
      console.error('Erro ao enviar email de cancelamento/reembolso:', emailError);
    }

    res.json({
      success: true,
      message: 'Pedido cancelado com sucesso',
      reembolso: {
        automatico: reembolsoAutomatico.solicitado,
        sucesso: reembolsoAutomatico.sucesso,
        pendente_admin: deveEntrarFilaAdmin || (reembolsoAutomatico.solicitado && !reembolsoAutomatico.sucesso),
        mensagem: reembolsoAutomatico.mensagem || (deveEntrarFilaAdmin
          ? 'Reembolso pendente para processamento manual pelo admin'
          : ''),
      },
      cobranca: {
        cancelada: cobrancaCancelada.solicitada,
        sucesso: cobrancaCancelada.sucesso,
        mensagem: cobrancaCancelada.mensagem,
      },
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

// GET /api/pedidos/admin/reembolsos - Listar fila de reembolsos pendentes
const listarReembolsosAdmin = async (req, res) => {
  try {
    await ensureReembolsoQueueTable(pool);

    const result = await pool.query(
      `SELECT r.id as reembolso_id,
              r.pedido_id,
              r.status as reembolso_status,
              r.motivo,
              r.erro,
              r.criado_em,
              p.status as pedido_status,
              p.total,
              p.forma_pagamento,
              p.asaas_payment_id,
              p.asaas_payment_status,
              p.data_pedido,
              u.nome as usuario_nome,
              u.email as usuario_email
       FROM pedidos_reembolso_admin r
       JOIN pedidos p ON p.id = r.pedido_id
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       WHERE r.status = 'pendente'
       ORDER BY r.criado_em DESC`
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar reembolsos admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar fila de reembolsos',
    });
  }
};

// POST /api/pedidos/:id/reembolso - Processar reembolso manual no Asaas (admin)
const processarReembolsoAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const valorInformado = parseNumber(req.body?.valor);
    const descricao = req.body?.descricao ? String(req.body.descricao).trim() : '';

    const pedidoResult = await pool.query(
      `SELECT p.*, u.nome as usuario_nome, u.email as usuario_email
       FROM pedidos p
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       WHERE p.id = $1`,
      [id]
    );

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pedido nao encontrado',
      });
    }

    const pedido = pedidoResult.rows[0];
    const formaPagamento = String(pedido.forma_pagamento || '').toLowerCase();
    const isPagamentoOnline = ['pix', 'boleto', 'cartao'].includes(formaPagamento);

    if (!isPagamentoOnline || !pedido.asaas_payment_id) {
      return res.status(400).json({
        success: false,
        error: 'Pedido nao possui pagamento online elegivel para reembolso no Asaas',
      });
    }

    const statusAtual = String(pedido.asaas_payment_status || '').toUpperCase();
    if (STATUS_ASAAS_REEMBOLSADO.has(statusAtual)) {
      return res.status(400).json({
        success: false,
        error: 'Pedido ja esta reembolsado no Asaas',
      });
    }

    let statusAsaasAtual = statusAtual;
    try {
      const paymentInfo = await getPayment(pedido.asaas_payment_id);
      statusAsaasAtual = String(paymentInfo?.status || statusAtual).toUpperCase();

      if (statusAsaasAtual && statusAsaasAtual !== statusAtual) {
        await pool.query(
          `UPDATE pedidos
           SET asaas_payment_status = $1,
               data_atualizacao = NOW()
           WHERE id = $2`,
          [statusAsaasAtual, id]
        );
      }
    } catch (syncError) {
      console.error('Falha ao sincronizar status Asaas antes do reembolso manual:', syncError?.response?.data || syncError.message || syncError);
    }

    if (!STATUS_ASAAS_ESTORNO_API.has(statusAsaasAtual)) {
      const motivo = statusAsaasAtual === 'RECEIVED_IN_CASH'
        ? 'status_sem_estorno_api'
        : 'aguardando_confirmacao_pagamento';

      await registrarReembolsoPendente(pool, Number(id), motivo, `status_asaas=${statusAsaasAtual || 'N/A'}`);

      return res.status(400).json({
        success: false,
        error: statusAsaasAtual === 'RECEIVED_IN_CASH'
          ? 'Este pagamento esta como RECEIVED_IN_CASH e nao permite estorno automatico pela API do Asaas. Oriente o cliente a contatar o WhatsApp para tratativa manual.'
          : `Reembolso ainda nao permitido no Asaas. Status atual: ${statusAsaasAtual || 'N/A'}`,
      });
    }

    const payload = {};
    if (valorInformado !== null && valorInformado > 0) {
      payload.value = roundMoney(valorInformado);
    }

    if (descricao) {
      payload.description = descricao;
    }

    const refundResult = await refundPayment(pedido.asaas_payment_id, payload);
    const novoStatus = String(refundResult?.status || 'REFUND_REQUESTED').toUpperCase();

    const updateResult = await pool.query(
      `UPDATE pedidos
       SET asaas_payment_status = $1,
           data_atualizacao = NOW()
       WHERE id = $2
       RETURNING *`,
      [novoStatus, id]
    );

    await marcarReembolsoConcluido(pool, Number(id), 'reembolso_manual_admin');

    res.json({
      success: true,
      message: 'Reembolso solicitado com sucesso no Asaas',
      data: updateResult.rows[0],
      asaas: refundResult,
    });
  } catch (error) {
    const erroAsaas = error?.response?.data;
    const invalidObject = Array.isArray(erroAsaas?.errors)
      && erroAsaas.errors.some((item) => item?.code === 'invalid_object');

    if (invalidObject) {
      return res.status(400).json({
        success: false,
        error: 'Somente e possivel estornar cobrancas recebidas ou confirmadas no Asaas',
      });
    }

    console.error('Erro ao processar reembolso manual:', erroAsaas || error.message || error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar reembolso no Asaas',
    });
  }
};

// POST /api/pedidos/:id/etiqueta - Enviar frete e criar etiqueta
const criarEtiqueta = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.usuario.id;
    const isAdmin = req.usuario.is_admin;
    const created = await criarEtiquetaPedido({
      pedidoId: id,
      userId,
      isAdmin,
      requestData: req.body || {},
    });

    return res.json({
      success: true,
      data: {
        pedido: created.pedido,
        superfrete: created.superfrete,
      },
    });
  } catch (error) {
    console.error('Erro ao criar etiqueta:', error?.response?.data || error.message || error);
    const details = error?.details || error?.response?.data || null;
    return res.status(error.statusCode || 500).json({
      success: false,
      error: 'Erro ao criar etiqueta no SuperFrete',
      details: process.env.NODE_ENV === 'development' ? details : undefined,
    });
  }
};

// POST /api/pedidos/:id/etiqueta/pagar - Finalizar pedido e gerar etiqueta
const pagarEtiqueta = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.usuario.id;
    const isAdmin = req.usuario.is_admin;
    const paid = await pagarEtiquetaPedido({ pedidoId: id, userId, isAdmin });

    return res.json({
      success: true,
      data: {
        pedido: paid.pedido,
        superfrete: paid.superfrete,
      },
    });
  } catch (error) {
    console.error('Erro ao pagar etiqueta:', error?.response?.data || error.message || error);
    const details = error?.details || error?.response?.data || null;
    return res.status(error.statusCode || 500).json({
      success: false,
      error: 'Erro ao finalizar etiqueta no SuperFrete',
      details: process.env.NODE_ENV === 'development' ? details : undefined,
    });
  }
};

// GET /api/pedidos/:id/etiqueta - Informacoes do pedido/etiqueta
const obterEtiqueta = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.usuario.id;
    const isAdmin = req.usuario.is_admin;

    const pedidoData = await buscarPedidoParaEtiqueta(id, userId, isAdmin);
    if (!pedidoData) {
      return res.status(404).json({
        success: false,
        error: 'Pedido nao encontrado',
      });
    }

    const orderId = pedidoData.pedido.superfrete_pedido_id;
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Pedido ainda nao possui etiqueta SuperFrete',
      });
    }

    const result = await obterPedidoSuperfrete(orderId);
    const info = extractSuperfreteInfo(result);

    const updates = [];
    const values = [];
    let index = 1;

    if (info.status) {
      updates.push(`superfrete_status = $${index++}`);
      values.push(info.status);
    }

    if (info.etiquetaUrl) {
      updates.push(`superfrete_etiqueta_url = $${index++}`);
      values.push(info.etiquetaUrl);
    }

    if (info.tracking && !pedidoData.pedido.codigo_rastreio) {
      updates.push(`codigo_rastreio = $${index++}`);
      values.push(info.tracking);
      updates.push(`status = 'enviado'`);
    }

    updates.push(`superfrete_raw_json = $${index++}`);
    values.push(result);
    updates.push('data_atualizacao = NOW()');

    if (updates.length) {
      values.push(id);
      await pool.query(
        `UPDATE pedidos SET ${updates.join(', ')} WHERE id = $${index}`,
        values
      );
    }

    return res.json({
      success: true,
      data: {
        superfrete: result,
      },
    });
  } catch (error) {
    console.error('Erro ao obter etiqueta:', error?.response?.data || error.message || error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao obter etiqueta no SuperFrete',
    });
  }
};

// POST /api/pedidos/:id/etiqueta/print - Link para impressao
const imprimirEtiqueta = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.usuario.id;
    const isAdmin = req.usuario.is_admin;

    const pedidoData = await buscarPedidoParaEtiqueta(id, userId, isAdmin);
    if (!pedidoData) {
      return res.status(404).json({
        success: false,
        error: 'Pedido nao encontrado',
      });
    }

    const orderId = pedidoData.pedido.superfrete_pedido_id;
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Pedido ainda nao possui etiqueta SuperFrete',
      });
    }

    if (!isSuperfreteLabelReady(pedidoData.pedido.superfrete_status)) {
      return res.status(409).json({
        success: false,
        error: 'Etiqueta ainda nao foi confirmada e paga no administrador',
      });
    }

    const result = await obterLinkEtiquetaSuperfrete([orderId]);
    const info = extractSuperfreteInfo(result);
    const etiquetaUrl = info.etiquetaUrl || result?.url || result?.data?.url || null;

    if (!etiquetaUrl) {
      return res.status(502).json({
        success: false,
        error: 'SuperFrete nao retornou um link de impressao para esta etiqueta',
      });
    }

    const updated = await pool.query(
      `UPDATE pedidos
       SET superfrete_etiqueta_url = $1,
           superfrete_raw_json = $2,
           data_atualizacao = NOW()
       WHERE id = $3
       RETURNING *`,
      [etiquetaUrl, result, id]
    );

    return res.json({
      success: true,
      data: {
        url: etiquetaUrl,
        pedido: updated.rows[0],
        superfrete: result,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar link de etiqueta:', error?.response?.data || error.message || error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: 'Erro ao gerar link de etiqueta no SuperFrete',
    });
  }
};

// POST /api/pedidos/:id/etiqueta/cancelar - Cancelar etiqueta
const cancelarEtiqueta = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo, payload } = req.body || {};
    const userId = req.usuario.id;
    const isAdmin = req.usuario.is_admin;

    const pedidoData = await buscarPedidoParaEtiqueta(id, userId, isAdmin);
    if (!pedidoData) {
      return res.status(404).json({
        success: false,
        error: 'Pedido nao encontrado',
      });
    }

    const orderId = pedidoData.pedido.superfrete_pedido_id;
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Pedido ainda nao possui etiqueta SuperFrete',
      });
    }

    const result = await cancelarPedidoSuperfrete(orderId, motivo, payload);
    const info = extractSuperfreteInfo(result);

    const updated = await pool.query(
      `UPDATE pedidos
       SET superfrete_status = $1,
           superfrete_raw_json = $2,
           status = 'cancelado',
           data_atualizacao = NOW()
       WHERE id = $3
       RETURNING *`,
      [info.status || 'cancelled', result, id]
    );

    return res.json({
      success: true,
      data: {
        pedido: updated.rows[0],
        superfrete: result,
      },
    });
  } catch (error) {
    console.error('Erro ao cancelar etiqueta:', error?.response?.data || error.message || error);
    const details = error?.response?.data || null;
    return res.status(500).json({
      success: false,
      error: 'Erro ao cancelar etiqueta no SuperFrete',
      details: process.env.NODE_ENV === 'development' ? details : undefined,
    });
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

// POST /api/pedidos/:id/confirmar-retirada - Confirmar retirada (admin)
const confirmarRetirada = async (req, res) => {
  const client = await pool.connect();

  try {
    const adminId = req.usuario.id;
    const { id } = req.params;
    const { codigo, nome_retirada, observacao } = req.body || {};

    if (!codigo || !nome_retirada) {
      return res.status(400).json({
        success: false,
        error: 'Codigo e nome de quem retirou sao obrigatorios',
      });
    }

    await client.query('BEGIN');

    const pedidoResult = await client.query(
      'SELECT id, entrega_tipo, status, retirada_codigo_hash, pagamento_na_retirada FROM pedidos WHERE id = $1',
      [id]
    );

    if (pedidoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Pedido nao encontrado',
      });
    }

    const pedido = pedidoResult.rows[0];

    if (pedido.entrega_tipo !== 'retirada_local') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Pedido nao e de retirada local',
      });
    }

    if (!['pronto_para_retirada', 'aguardando_pagamento_retirada', 'pendente_pagamento_retirada'].includes(pedido.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Pedido nao pode ser retirado no status '${pedido.status}'`,
      });
    }

    const bloqueioResult = await client.query(
      `SELECT COUNT(*) AS total
       FROM retirada_auditoria
       WHERE pedido_id = $1
         AND tipo_evento = 'validacao_falha'
         AND data_evento >= NOW() - INTERVAL '3 minutes'`,
      [id]
    );

    const tentativasRecentes = Number.parseInt(bloqueioResult.rows[0]?.total || '0', 10);
    if (tentativasRecentes >= 3) {
      await client.query('ROLLBACK');
      return res.status(429).json({
        success: false,
        error: 'Limite de tentativas excedido. Tente novamente em alguns minutos.',
      });
    }

    const codigoHash = hashCodigoRetirada(codigo);
    if (!pedido.retirada_codigo_hash || codigoHash !== pedido.retirada_codigo_hash) {
      await client.query(
        `INSERT INTO retirada_auditoria (pedido_id, admin_id, tipo_evento, descricao, ip_admin)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, adminId, 'validacao_falha', `Codigo informado: ${mascararCodigoRetirada(codigo)}`, req.ip]
      );

      await client.query('COMMIT');
      return res.status(400).json({
        success: false,
        error: 'Codigo invalido',
      });
    }

    const updateResult = await client.query(
      `UPDATE pedidos
       SET status = 'retirado',
           retirada_confirmada_em = NOW(),
           retirada_confirmada_por = $1,
           retirada_confirmado_por_nome = $2,
           retirada_observacao = $3,
           data_atualizacao = NOW()
       WHERE id = $4
       RETURNING *`,
      [adminId, nome_retirada, observacao || null, id]
    );

    if (pedido.pagamento_na_retirada) {
      const itensResult = await client.query(
        'SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = $1',
        [id]
      );

      for (const item of itensResult.rows) {
        await client.query(
          'UPDATE produtos SET vendas_total = vendas_total + $1 WHERE id = $2',
          [item.quantidade, item.produto_id]
        );
      }
    }

    await client.query(
      `INSERT INTO retirada_auditoria (pedido_id, admin_id, tipo_evento, descricao, ip_admin)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, adminId, 'validacao_sucesso', `Retirada confirmada por ${nome_retirada}`, req.ip]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Retirada confirmada com sucesso',
      data: updateResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao confirmar retirada:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao confirmar retirada',
    });
  } finally {
    client.release();
  }
};

// GET /api/pedidos/admin/retiradas - Listar retiradas (admin)
const listarRetiradasAdmin = async (req, res) => {
  try {
    await ensureRetiradaCodigoTable(pool);

    const { status, cliente_id, data_inicio, data_fim, limite = 20, pagina = 1 } = req.query;
    const offset = (pagina - 1) * limite;

    let query = `
      SELECT p.*, u.nome as usuario_nome, u.email as usuario_email,
             (
               SELECT rc.codigo
               FROM retirada_codigos rc
               WHERE rc.pedido_id = p.id
               ORDER BY rc.criado_em DESC
               LIMIT 1
             ) as retirada_codigo,
             CASE
               WHEN p.pagamento_na_retirada = true THEN true
               WHEN COALESCE(p.asaas_payment_status, '') IN ('CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH') THEN true
               ELSE false
             END as pagamento_verificado
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      WHERE (
        COALESCE(LOWER(TRIM(p.entrega_tipo)), '') IN ('retirada_local', 'retirada no local', 'retirada-no-local', 'retirada', 'retirar_no_local')
        OR p.status IN ('pronto_para_retirada', 'aguardando_pagamento_retirada', 'pendente_pagamento_retirada', 'retirado')
      )
    `;

    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (cliente_id) {
      query += ` AND p.usuario_id = $${paramCount}`;
      params.push(cliente_id);
      paramCount++;
    }

    if (data_inicio) {
      query += ` AND p.data_pedido >= $${paramCount}`;
      params.push(data_inicio);
      paramCount++;
    }

    if (data_fim) {
      query += ` AND p.data_pedido <= $${paramCount}`;
      params.push(data_fim);
      paramCount++;
    }

    query += ` ORDER BY p.data_pedido DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limite, offset);

    const result = await pool.query(query, params);

    let countQuery = `
      SELECT COUNT(*)
      FROM pedidos p
      WHERE (
        COALESCE(LOWER(TRIM(p.entrega_tipo)), '') IN ('retirada_local', 'retirada no local', 'retirada-no-local', 'retirada', 'retirar_no_local')
        OR p.status IN ('pronto_para_retirada', 'aguardando_pagamento_retirada', 'pendente_pagamento_retirada', 'retirado')
      )
    `;
    const countParams = [];
    let countParamCount = 1;

    if (status) {
      countQuery += ` AND p.status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (cliente_id) {
      countQuery += ` AND p.usuario_id = $${countParamCount}`;
      countParams.push(cliente_id);
      countParamCount++;
    }

    if (data_inicio) {
      countQuery += ` AND p.data_pedido >= $${countParamCount}`;
      countParams.push(data_inicio);
      countParamCount++;
    }

    if (data_fim) {
      countQuery += ` AND p.data_pedido <= $${countParamCount}`;
      countParams.push(data_fim);
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);

    const serialized = result.rows.map(serializarPedido);

    res.json({
      success: true,
      count: serialized.length,
      total: parseInt(countResult.rows[0].count, 10),
      pagina: parseInt(pagina, 10),
      totalPaginas: Math.ceil(countResult.rows[0].count / limite),
      data: serialized,
    });
  } catch (error) {
    console.error('Erro ao listar retiradas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar retiradas',
    });
  }
};

// GET /api/pedidos/admin/retiradas/:id/historico - Historico de retiradas
const obterHistoricoRetirada = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM retirada_auditoria
       WHERE pedido_id = $1
       ORDER BY data_evento DESC`,
      [id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Erro ao obter historico de retirada:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter historico de retirada',
    });
  }
};

module.exports = {
  criarPedido,
  listarPedidos,
  obterPedido,
  atualizarPixQrCode,
  obterRastreamento,
  confirmarRetirada,
  listarRetiradasAdmin,
  obterHistoricoRetirada,
  atualizarStatus,
  adicionarRastreio,
  cancelarPedido,
  listarReembolsosAdmin,
  processarReembolsoAdmin,
  criarEtiqueta,
  pagarEtiqueta,
  obterEtiqueta,
  imprimirEtiqueta,
  cancelarEtiqueta,
};
