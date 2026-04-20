require('dotenv').config();

const { pool } = require('./config/database');
const { enviarEmailConfirmacaoPagamento } = require('./services/emailService');

async function run() {
  const pedidoId = Number(process.argv[2] || 76);

  const result = await pool.query(
    `SELECT p.id, p.total, p.forma_pagamento, p.entrega_tipo, u.nome, u.email
     FROM pedidos p
     JOIN usuarios u ON u.id = p.usuario_id
     WHERE p.id = $1`,
    [pedidoId]
  );

  if (result.rows.length === 0) {
    console.log('Pedido nao encontrado');
    return;
  }

  const pedido = result.rows[0];

  await enviarEmailConfirmacaoPagamento(pedido.email, {
    id: pedido.id,
    nome: pedido.nome,
    email: pedido.email,
    total: parseFloat(pedido.total || 0),
    forma_pagamento: pedido.forma_pagamento,
    entrega_tipo: pedido.entrega_tipo,
  });

  console.log(`Email de confirmacao enviado para ${pedido.email} (pedido #${pedido.id})`);
}

run()
  .catch((error) => {
    console.error('Erro no teste de envio:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
