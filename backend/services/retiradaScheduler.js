const cron = require('node-cron');
const { pool } = require('../config/database');
const { notifyAdmins, notifyUser } = require('./notificationService');
const {
  enviarEmailLembreteRetirada,
  enviarEmailCancelamentoRetirada,
} = require('./emailService');

const formatDateYMD = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getActiveConfig = async () => {
  const result = await pool.query(
    `SELECT * FROM retirada_config WHERE ativo = true ORDER BY id DESC LIMIT 1`
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return {
    nome_local: 'Shopping Jequitibas',
    endereco: 'Av. Jequitibas, 1234',
    horario_segunda_sabado: '10:00-17:00',
    prazo_dias_retirada: 7,
  };
};

const restoreEstoque = async (client, pedidoId, pagamentoNaRetirada) => {
  const itensResult = await client.query(
    'SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = $1',
    [pedidoId]
  );

  for (const item of itensResult.rows) {
    const produtoAntes = await client.query(
      'SELECT ativo, estoque, nome FROM produtos WHERE id = $1',
      [item.produto_id]
    );

    const estoqueAntes = produtoAntes.rows[0]?.estoque || 0;
    const estaInativo = produtoAntes.rows[0]?.ativo === false;
    const nomeProduto = produtoAntes.rows[0]?.nome || 'Produto';
    const estoqueDepois = estoqueAntes + item.quantidade;

    if (pagamentoNaRetirada) {
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

    if (estaInativo && estoqueAntes === 0 && estoqueDepois > 0) {
      await client.query('UPDATE produtos SET ativo = true WHERE id = $1', [item.produto_id]);

      notifyAdmins({
        tipoEvento: 'estoque_restaurado',
        titulo: '✅ Produto reativado',
        mensagem: `O produto "${nomeProduto}" teve o estoque restaurado para ${estoqueDepois} unidade(s) e foi reativado automaticamente.`,
        payload: {
          produto_id: item.produto_id,
          produto_nome: nomeProduto,
          estoque_anterior: estoqueAntes,
          estoque_atual: estoqueDepois,
        },
      }).catch((err) => console.error('Erro ao notificar admins sobre estoque restaurado:', err));
    }
  }
};

const enviarLembretes = async (hoje) => {
  const config = await getActiveConfig();
  const hojeYMD = formatDateYMD(hoje);
  const diasLembrete = [4, 2, 1];

  const pedidosResult = await pool.query(
    `SELECT p.id, p.usuario_id, p.retirada_prazo_vencimento, u.email, u.nome
     FROM pedidos p
     LEFT JOIN usuarios u ON p.usuario_id = u.id
     WHERE p.entrega_tipo = 'retirada_local'
       AND p.status = 'pronto_para_retirada'
       AND p.retirada_prazo_vencimento IS NOT NULL`
  );

  for (const pedido of pedidosResult.rows) {
    const prazo = pedido.retirada_prazo_vencimento;
    if (!prazo) {
      continue;
    }

    const prazoDate = new Date(prazo);
    const diffMs = prazoDate.getTime() - hoje.getTime();
    const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (!diasLembrete.includes(diasRestantes)) {
      continue;
    }

    const tipoEvento = `lembrete_retirada_D${diasRestantes}`;

    const auditResult = await pool.query(
      `SELECT id FROM retirada_auditoria
       WHERE pedido_id = $1 AND tipo_evento = $2 LIMIT 1`,
      [pedido.id, tipoEvento]
    );

    if (auditResult.rows.length > 0) {
      continue;
    }

    await enviarEmailLembreteRetirada(pedido.email, {
      pedido_id: pedido.id,
      nome: pedido.nome,
      data_limite: formatDateYMD(prazoDate),
      dias_restantes: diasRestantes,
      local: config.nome_local,
      endereco: config.endereco,
      horario: config.horario_segunda_sabado,
    }).catch((error) => console.error('Erro ao enviar lembrete de retirada:', error));

    await pool.query(
      `INSERT INTO retirada_auditoria (pedido_id, admin_id, tipo_evento, descricao, ip_admin)
       VALUES ($1, $2, $3, $4, $5)`,
      [pedido.id, null, tipoEvento, `Lembrete enviado (${diasRestantes} dia(s) restante(s))`, null]
    );
  }
};

const cancelarPedidosVencidos = async (hoje) => {
  const hojeYMD = formatDateYMD(hoje);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const pedidosResult = await client.query(
      `SELECT p.*, u.email, u.nome
       FROM pedidos p
       LEFT JOIN usuarios u ON p.usuario_id = u.id
       WHERE p.entrega_tipo = 'retirada_local'
         AND p.status = 'pronto_para_retirada'
         AND p.retirada_prazo_vencimento IS NOT NULL
         AND p.retirada_prazo_vencimento < $1`,
      [hojeYMD]
    );

    for (const pedido of pedidosResult.rows) {
      await client.query(
        `UPDATE pedidos
         SET status = 'cancelado',
             retirada_cancelado_automatico = true,
             data_atualizacao = NOW()
         WHERE id = $1`,
        [pedido.id]
      );

      await client.query(
        `INSERT INTO retirada_auditoria (pedido_id, admin_id, tipo_evento, descricao, ip_admin)
         VALUES ($1, $2, $3, $4, $5)`,
        [pedido.id, null, 'cancelamento_prazo', 'Cancelado automaticamente por prazo expirado', null]
      );

      await restoreEstoque(client, pedido.id, pedido.pagamento_na_retirada === true);

      await enviarEmailCancelamentoRetirada(pedido.email, {
        pedido_id: pedido.id,
        nome: pedido.nome,
        data_limite: formatDateYMD(new Date(pedido.retirada_prazo_vencimento)),
      }).catch((error) => console.error('Erro ao enviar email de cancelamento:', error));

      if (pedido.usuario_id) {
        await notifyUser(pedido.usuario_id, {
          tipoEvento: 'retirada_cancelada',
          titulo: 'Pedido cancelado por prazo expirado',
          mensagem: `Seu pedido #${pedido.id} foi cancelado por falta de retirada dentro do prazo.`,
          payload: {
            pedido_id: pedido.id,
          },
        }).catch((error) => console.error('Erro ao notificar usuário:', error));
      }

      await notifyAdmins({
        tipoEvento: 'retirada_cancelada',
        titulo: 'Pedido cancelado por prazo expirado',
        mensagem: `Pedido #${pedido.id} de ${pedido.nome || `ID ${pedido.usuario_id}`} cancelado automaticamente por prazo expirado.`,
        payload: {
          pedido_id: pedido.id,
          usuario_id: pedido.usuario_id,
          usuario_nome: pedido.nome || `ID ${pedido.usuario_id}`,
        },
      }).catch((error) => console.error('Erro ao notificar admins:', error));
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao cancelar pedidos vencidos:', error);
  } finally {
    client.release();
  }
};

const executarRotinaRetirada = async () => {
  const hoje = new Date();
  const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  await enviarLembretes(hojeSemHora);
  await cancelarPedidosVencidos(hojeSemHora);
};

const iniciarSchedulerRetirada = () => {
  const cronExpression = process.env.RETIRADA_CRON || '0 9 * * *';

  cron.schedule(cronExpression, () => {
    executarRotinaRetirada().catch((error) => {
      console.error('Erro na rotina de retirada:', error);
    });
  });

  console.info(`⏱️ Scheduler de retirada configurado: ${cronExpression}`);
};

module.exports = {
  iniciarSchedulerRetirada,
  executarRotinaRetirada,
};
