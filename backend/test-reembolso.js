require('dotenv').config();
const axios = require('axios');
const { pool } = require('./config/database');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

const STATUS_ASAAS_PAGO = new Set(['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH']);
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function obterTokenAdmin() {
  if (process.env.ADMIN_TOKEN) {
    return process.env.ADMIN_TOKEN;
  }

  const email = process.env.ADMIN_EMAIL;
  const senha = process.env.ADMIN_PASSWORD;

  if (!email || !senha) {
    throw new Error('Defina ADMIN_TOKEN ou ADMIN_EMAIL/ADMIN_PASSWORD no .env para testar endpoints admin');
  }

  const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, senha });
  const token = response?.data?.data?.token;

  if (!token) {
    throw new Error('Não foi possível obter token admin no login');
  }

  return token;
}

async function analisarRegraReembolso(pedidoId) {
  const result = await pool.query(
    `SELECT id, status, forma_pagamento, asaas_payment_id, asaas_payment_status, data_pedido
     FROM pedidos
     WHERE id = $1`,
    [pedidoId]
  );

  if (result.rows.length === 0) {
    throw new Error(`Pedido #${pedidoId} não encontrado`);
  }

  const pedido = result.rows[0];
  const formaPagamento = String(pedido.forma_pagamento || '').toLowerCase();
  const isPagamentoOnline = ['pix', 'boleto', 'cartao'].includes(formaPagamento);
  const statusAsaas = String(pedido.asaas_payment_status || '').toUpperCase();
  const pagamentoConfirmado = isPagamentoOnline && Boolean(pedido.asaas_payment_id) && STATUS_ASAAS_PAGO.has(statusAsaas);
  const dentroPrazo = pedido.data_pedido
    ? (Date.now() - new Date(pedido.data_pedido).getTime()) <= TWO_HOURS_MS
    : false;

  const auto = pagamentoConfirmado && dentroPrazo;

  log(colors.cyan, `\n📦 Pedido #${pedido.id}`);
  console.log({
    status: pedido.status,
    forma_pagamento: pedido.forma_pagamento,
    asaas_payment_id: pedido.asaas_payment_id,
    asaas_payment_status: pedido.asaas_payment_status,
    data_pedido: pedido.data_pedido,
    pagamento_online_confirmado: pagamentoConfirmado,
    dentro_janela_2h: dentroPrazo,
    reembolso_automatico_no_cancelamento: auto,
  });
}

async function listarFilaReembolso() {
  const token = await obterTokenAdmin();
  const response = await axios.get(`${API_BASE_URL}/api/pedidos/admin/reembolsos`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const lista = response?.data?.data || [];
  log(colors.cyan, `\n🧾 Reembolsos pendentes: ${lista.length}`);
  lista.slice(0, 20).forEach((item) => {
    console.log(`#${item.pedido_id} | cliente=${item.usuario_nome || 'N/A'} | status_asaas=${item.asaas_payment_status || 'N/A'} | motivo=${item.motivo}`);
  });
}

async function processarReembolsoManual(pedidoId, valor) {
  const token = await obterTokenAdmin();

  const payload = {};
  if (valor !== undefined && valor !== null && !Number.isNaN(Number(valor))) {
    payload.valor = Number(valor);
  }

  const response = await axios.post(`${API_BASE_URL}/api/pedidos/${pedidoId}/reembolso`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

  log(colors.green, `\n✅ Reembolso manual solicitado para pedido #${pedidoId}`);
  console.log(response?.data);
}

async function main() {
  const modo = (process.argv[2] || '').toLowerCase();
  const pedidoId = Number(process.argv[3]);
  const valor = process.argv[4] ? Number(process.argv[4]) : undefined;

  try {
    if (modo === 'analisar') {
      if (!pedidoId) throw new Error('Uso: node test-reembolso.js analisar <pedidoId>');
      await analisarRegraReembolso(pedidoId);
      return;
    }

    if (modo === 'fila') {
      await listarFilaReembolso();
      return;
    }

    if (modo === 'manual') {
      if (!pedidoId) throw new Error('Uso: node test-reembolso.js manual <pedidoId> [valor]');
      await processarReembolsoManual(pedidoId, valor);
      return;
    }

    console.log('Uso:');
    console.log('  node test-reembolso.js analisar <pedidoId>');
    console.log('  node test-reembolso.js fila');
    console.log('  node test-reembolso.js manual <pedidoId> [valor]');
  } catch (error) {
    log(colors.red, `\n❌ ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      console.log(error.response.data);
    }
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
}

main();
