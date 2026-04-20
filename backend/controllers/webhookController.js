const { pool } = require('../config/database');
const { notifyAdmins, notifyUser } = require('../services/notificationService');
const { enviarEmailConfirmacaoPagamento, enviarEmailNotificacaoPagamentoAdmin, enviarEmailCodigoRetirada } = require('../services/emailService');
const {
  ensureRetiradaCodigoTable,
  gerarCodigoRetirada,
  hashCodigoRetirada,
  saveRetiradaCodigo,
  getRetiradaCodigo,
} = require('../services/retiradaCodigoService');
const { adjustProductStock } = require('../services/inventoryService');
const { criarEtiquetaPedido, pagarEtiquetaPedido } = require('../services/pedidoEtiquetaService');

const STATUS_ASAAS_PAGO = new Set(['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH']);
const STATUS_PEDIDO_CONFIRMADO = new Set(['processando', 'pronto_para_retirada', 'retirado', 'pago']);

const parseBoolean = (value, fallback = false) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
};

const isRetiradaLocalPedido = (pedido) => {
  const entregaTipo = String(pedido?.entrega_tipo || '').toLowerCase().trim();
  if (['retirada_local', 'retirada no local', 'retirada-no-local', 'retirada', 'retirar_no_local'].includes(entregaTipo)) {
    return true;
  }

  const statusPedido = String(pedido?.status || '').toLowerCase();
  if (['pronto_para_retirada', 'aguardando_pagamento_retirada', 'pendente_pagamento_retirada', 'retirado'].includes(statusPedido)) {
    return true;
  }

  return Boolean(pedido?.pagamento_na_retirada);
};

/**
 * Webhook do Asaas para notificações de pagamento
 * POST /api/webhooks/asaas
 * 
 * Documentação: https://docs.asaas.com/reference/webhooks
 * 
 * Eventos principais:
 * - PAYMENT_CREATED: Pagamento criado
 * - PAYMENT_UPDATED: Pagamento atualizado
 * - PAYMENT_CONFIRMED: Pagamento confirmado (PIX/Boleto pago)
 * - PAYMENT_RECEIVED: Pagamento recebido (final)
 * - PAYMENT_OVERDUE: Pagamento vencido
 * - PAYMENT_DELETED: Pagamento deletado
 * - PAYMENT_RESTORED: Pagamento restaurado
 * - PAYMENT_REFUNDED: Pagamento reembolsado
 */
const asaasWebhook = async (req, res) => {
  try {
    await ensureRetiradaCodigoTable(pool);

    const { event, payment } = req.body;

    // Validar presença dos dados essenciais
    if (!event || !payment || !payment.id) {
      return res.status(400).json({
        success: false,
        error: 'Dados do webhook incompletos',
      });
    }

    // Buscar pedido associado ao payment_id
    const pedidoResult = await pool.query(
      'SELECT * FROM pedidos WHERE asaas_payment_id = $1',
      [payment.id]
    );

    if (pedidoResult.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Webhook recebido, mas pedido não encontrado',
      });
    }

    const pedido = pedidoResult.rows[0];
    const isRetiradaLocal = isRetiradaLocalPedido(pedido);
    const pagamentoJaConfirmadoNoPedido = STATUS_ASAAS_PAGO.has(String(pedido.asaas_payment_status || '').toUpperCase());
    const statusJaConfirmado = STATUS_PEDIDO_CONFIRMADO.has(String(pedido.status || '').toLowerCase())
      || pagamentoJaConfirmadoNoPedido;
    const pagamentoConfirmadoNoPayload = STATUS_ASAAS_PAGO.has(String(payment.status || '').toUpperCase());

    // Processar evento baseado no tipo
    let novoStatus = pedido.status;
    let atualizarPedido = false;
    let notificarUsuario = false;
    let mensagemNotificacao = '';
    let deveEnviarCodigoRetirada = false;

    switch (event) {
      case 'PAYMENT_CREATED':
        atualizarPedido = true;
        break;

      case 'PAYMENT_UPDATED':
        if (pagamentoConfirmadoNoPayload) {
          novoStatus = isRetiradaLocal ? 'pronto_para_retirada' : 'processando';
          atualizarPedido = true;
          notificarUsuario = true;
          mensagemNotificacao = `Pagamento do pedido #${pedido.id} confirmado! Valor: R$ ${payment.value}`;
          deveEnviarCodigoRetirada = isRetiradaLocal && !pedido.pagamento_na_retirada && !statusJaConfirmado;
        } else {
          atualizarPedido = true;
        }
        break;

      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_RECEIVED_IN_CASH':
        // Quando pagamento confirma, mover para preparo (exceto retirada local).
        novoStatus = isRetiradaLocal ? 'pronto_para_retirada' : 'processando';
        atualizarPedido = true;
        notificarUsuario = true;
        mensagemNotificacao = `Pagamento do pedido #${pedido.id} confirmado! Valor: R$ ${payment.value}`;
        deveEnviarCodigoRetirada = isRetiradaLocal && !pedido.pagamento_na_retirada && !statusJaConfirmado;
        
        // REDUZIR ESTOQUE AGORA (quando pagamento confirmado)
        if (!pagamentoJaConfirmadoNoPedido) {
          try {
            // Buscar itens do pedido
            const itensResult = await pool.query(
              'SELECT produto_id, quantidade, tamanho FROM itens_pedido WHERE pedido_id = $1',
              [pedido.id]
            );

            // Atualizar estoque de cada produto
            for (const item of itensResult.rows) {
              const ajuste = await adjustProductStock(pool, {
                produtoId: item.produto_id,
                quantidade: item.quantidade,
                tamanho: item.tamanho,
                movement: 'saida',
                adjustSales: true,
              });

              if (ajuste.success) {
                const estoqueAtualizado = ajuste.data?.estoque;
                const nomeProduto = ajuste.data?.nome;
                
                // Se estoque zerou, inativar produto e notificar
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
                      estoque_atual: 0
                    }
                  }).catch(err => console.error('Erro ao notificar admins sobre estoque:', err));
                }
              } else {
                console.error(`⚠️ Não foi possível reduzir estoque do produto #${item.produto_id} - ${ajuste.error}`);
              }
            }
          } catch (estoqueError) {
            console.error('❌ Erro ao atualizar estoque após pagamento:', estoqueError);
            // Não bloquear o webhook por erro de estoque
          }
        } else {
          console.info(`ℹ️ Pedido #${pedido.id} já estava com pagamento confirmado; estoque não será reduzido novamente.`);
        }
        
        // Notificar admins também
        let clienteNome = '';
        try {
          const clienteResult = await pool.query(
            'SELECT nome FROM usuarios WHERE id = $1',
            [pedido.usuario_id]
          );
          if (clienteResult.rows.length > 0) {
            clienteNome = String(clienteResult.rows[0].nome || '').trim();
          }
        } catch (clienteError) {
          console.error('Erro ao buscar nome do cliente:', clienteError);
        }

        const clienteLabel = clienteNome || `Cliente ${pedido.usuario_id}`;
        await notifyAdmins({
          tipoEvento: 'pagamento_confirmado',
          titulo: '💰 Pagamento Confirmado',
          mensagem: `Pedido #${pedido.id} - R$ ${payment.value} - Cliente: ${clienteLabel}`,
          payload: {
            pedido_id: pedido.id,
            usuario_id: pedido.usuario_id,
            usuario_nome: clienteLabel,
            payment_id: payment.id,
            value: payment.value,
          },
        }).catch(err => console.error('Erro ao notificar admins:', err));
        break;

      case 'PAYMENT_OVERDUE':
        atualizarPedido = true;
        notificarUsuario = true;
        mensagemNotificacao = `O pagamento do pedido #${pedido.id} venceu. Por favor, gere um novo boleto/PIX.`;
        break;

      case 'PAYMENT_REFUNDED':
        novoStatus = 'cancelado';
        atualizarPedido = true;
        notificarUsuario = true;
        mensagemNotificacao = `Pagamento do pedido #${pedido.id} foi reembolsado.`;
        break;

      case 'PAYMENT_DELETED':
        atualizarPedido = true;
        break;

      default:
        atualizarPedido = true;
    }

    // Atualizar registro do pedido
    if (atualizarPedido) {
      const updateQuery = `
        UPDATE pedidos 
        SET 
          asaas_payment_status = $1,
          status = $2,
          data_atualizacao = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const updated = await pool.query(updateQuery, [
        payment.status || pedido.asaas_payment_status,
        novoStatus,
        pedido.id,
      ]);

      const autoCreateLabel = parseBoolean(process.env.SUPERFRETE_AUTO_CREATE_LABEL_ON_PAYMENT, false);
      const autoPayLabel = parseBoolean(process.env.SUPERFRETE_AUTO_PAY_LABEL_ON_PAYMENT, false);

      if (
        autoCreateLabel &&
        !isRetiradaLocal &&
        (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_RECEIVED_IN_CASH') &&
        !pedido.superfrete_pedido_id
      ) {
        try {
          await criarEtiquetaPedido({
            pedidoId: pedido.id,
            isAdmin: true,
          });

          if (autoPayLabel) {
            await pagarEtiquetaPedido({
              pedidoId: pedido.id,
              isAdmin: true,
            });
          }
        } catch (labelError) {
          console.error('❌ Erro ao automatizar etiqueta SuperFrete apos pagamento:', labelError?.response?.data || labelError.message || labelError);
        }
      }

      // Notificar usuário se necessário
      if (notificarUsuario && pedido.usuario_id) {
        await notifyUser(pedido.usuario_id, {
          tipoEvento: event.toLowerCase(),
          titulo: event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED' 
            ? '✅ Pagamento Confirmado!' 
            : 'Atualização de Pagamento',
          mensagem: mensagemNotificacao,
          payload: {
            pedido_id: pedido.id,
            status: novoStatus,
            payment_status: payment.status,
            value: payment.value,
          },
        }).catch(err => console.error('Erro ao notificar usuário via sockets:', err));

        // Se for confirmação de pagamento, enviar emails também
        if ((event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_RECEIVED_IN_CASH') && pedido.usuario_id) {
          try {
            // Buscar dados do usuário para o email
            const usuarioResult = await pool.query(
              'SELECT email, nome FROM usuarios WHERE id = $1',
              [pedido.usuario_id]
            );

            if (usuarioResult.rows.length > 0) {
              const usuario = usuarioResult.rows[0];
              
              // Preparar dados do pedido para o email
              const dadosPedidoEmail = {
                id: pedido.id,
                nome: usuario.nome,
                email: usuario.email,
                total: parseFloat(payment.value || pedido.valor_total || 0),
                forma_pagamento: pedido.forma_pagamento,
                entrega_tipo: pedido.entrega_tipo,
              };

              // Enviar email de confirmação de pagamento para o cliente
              await enviarEmailConfirmacaoPagamento(usuario.email, dadosPedidoEmail)
                .catch(err => console.error('Erro ao enviar email para cliente:', err));

              if (deveEnviarCodigoRetirada) {
                try {
                  let codigoRetirada = await getRetiradaCodigo(pool, pedido.id);

                  if (!codigoRetirada) {
                    codigoRetirada = gerarCodigoRetirada(Boolean(pedido.pagamento_na_retirada));
                    await saveRetiradaCodigo(pool, pedido.id, codigoRetirada);

                    const codigoHash = hashCodigoRetirada(codigoRetirada);
                    await pool.query(
                      `UPDATE pedidos
                       SET retirada_codigo_hash = $1,
                           retirada_codigo_gerado_em = COALESCE(retirada_codigo_gerado_em, NOW()),
                           retirada_prazo_vencimento = COALESCE(retirada_prazo_vencimento, CURRENT_DATE + INTERVAL '7 days')
                       WHERE id = $2`,
                      [codigoHash, pedido.id]
                    );
                  }

                  const configResult = await pool.query(
                    'SELECT * FROM retirada_config WHERE ativo = true ORDER BY id DESC LIMIT 1'
                  );

                  const config = configResult.rows[0] || {
                    nome_local: 'Shopping Jequitibas',
                    endereco: 'Av. Jequitibas, 1234',
                    horario_segunda_sabado: '10:00-17:00',
                  };

                  const prazoRetirada = pedido.retirada_prazo_vencimento
                    ? new Date(pedido.retirada_prazo_vencimento).toISOString().split('T')[0]
                    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                  await enviarEmailCodigoRetirada(usuario.email, {
                    pedido_id: pedido.id,
                    nome: usuario.nome,
                    codigo: codigoRetirada,
                    data_limite: prazoRetirada,
                    local: config.nome_local,
                    endereco: config.endereco,
                    horario: config.horario_segunda_sabado,
                  });
                } catch (retiradaEmailError) {
                  console.error('❌ Erro ao enviar email de código de retirada:', retiradaEmailError);
                }
              }

              // Buscar todos os admins para notificá-los
              const adminsResult = await pool.query(
                `SELECT id, email, nome FROM usuarios 
                 WHERE is_admin = true AND ativo = true`
              );

              if (adminsResult.rows.length > 0) {
                // Enviar notificação de pagamento para admins
                await enviarEmailNotificacaoPagamentoAdmin(adminsResult.rows, dadosPedidoEmail)
                  .catch(err => console.error('Erro ao enviar email para admins:', err));
              }
            }
          } catch (emailError) {
            console.error('❌ Erro ao enviar emails de confirmação:', emailError);
            // Não falhar o webhook por erro de email
          }
        }
      }
    }

    // Responder sucesso para o Asaas
    return res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso',
      pedido_id: pedido.id,
      event,
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook Asaas:', error);
    
    // Mesmo em caso de erro, retornar 200 para evitar reenvios infinitos
    // Log do erro para investigação posterior
    return res.status(200).json({
      success: false,
      error: 'Erro ao processar webhook',
      message: error.message,
    });
  }
};

/**
 * Middleware de validação do webhook Asaas
 * Verifica token de acesso configurado
 */
const validateAsaasWebhook = (req, res, next) => {
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;

  // Se não houver token configurado, apenas logar aviso e permitir
  if (!webhookToken) {
    return next();
  }

  // Verificar token no header ou query
  const providedToken = 
    req.headers['x-webhook-token'] || 
    req.headers['authorization']?.replace('Bearer ', '') ||
    req.query.token;

  if (!providedToken) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticação não fornecido',
    });
  }

  if (providedToken !== webhookToken) {
    return res.status(403).json({
      success: false,
      error: 'Token de autenticação inválido',
    });
  }
  next();
};

module.exports = {
  asaasWebhook,
  validateAsaasWebhook,
};
