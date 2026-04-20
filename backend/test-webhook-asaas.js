/**
 * Script de teste do Webhook Asaas
 * 
 * Simula o envio de notificações do Asaas para testar
 * o processamento de webhooks localmente
 * 
 * Uso: node test-webhook-asaas.js
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN;

// Payloads de teste simulando diferentes eventos do Asaas
const testPayloads = {
  PAYMENT_CREATED: {
    event: 'PAYMENT_CREATED',
    payment: {
      id: 'pay_test_12345',
      customer: 'cus_test_67890',
      billingType: 'PIX',
      value: 150.00,
      netValue: 148.50,
      status: 'PENDING',
      dueDate: '2026-02-15',
      description: 'Pedido #1 - Teste',
      externalReference: 'pedido-1',
    }
  },
  
  PAYMENT_CONFIRMED: {
    event: 'PAYMENT_CONFIRMED',
    payment: {
      id: 'pay_test_12345',
      customer: 'cus_test_67890',
      billingType: 'PIX',
      value: 150.00,
      netValue: 148.50,
      status: 'CONFIRMED',
      dueDate: '2026-02-15',
      confirmedDate: '2026-02-11',
      paymentDate: '2026-02-11',
      description: 'Pedido #1 - Teste',
      externalReference: 'pedido-1',
    }
  },

  PAYMENT_RECEIVED: {
    event: 'PAYMENT_RECEIVED',
    payment: {
      id: 'pay_test_12345',
      customer: 'cus_test_67890',
      billingType: 'PIX',
      value: 150.00,
      netValue: 148.50,
      status: 'RECEIVED',
      dueDate: '2026-02-15',
      confirmedDate: '2026-02-11',
      paymentDate: '2026-02-11',
      clientPaymentDate: '2026-02-11',
      description: 'Pedido #1 - Teste',
      externalReference: 'pedido-1',
    }
  },

  PAYMENT_OVERDUE: {
    event: 'PAYMENT_OVERDUE',
    payment: {
      id: 'pay_test_12345',
      customer: 'cus_test_67890',
      billingType: 'BOLETO',
      value: 150.00,
      netValue: 148.50,
      status: 'OVERDUE',
      dueDate: '2026-02-10',
      description: 'Pedido #1 - Teste',
      externalReference: 'pedido-1',
    }
  },

  PAYMENT_REFUNDED: {
    event: 'PAYMENT_REFUNDED',
    payment: {
      id: 'pay_test_12345',
      customer: 'cus_test_67890',
      billingType: 'PIX',
      value: 150.00,
      netValue: 148.50,
      status: 'REFUNDED',
      dueDate: '2026-02-15',
      refundedDate: '2026-02-11',
      description: 'Pedido #1 - Teste',
      externalReference: 'pedido-1',
    }
  },
};

async function testWebhook(eventType) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Testando evento: ${eventType}`);
    console.log('='.repeat(60));

    const payload = testPayloads[eventType];
    if (!payload) {
      console.error(`❌ Evento ${eventType} não encontrado`);
      return;
    }

    console.log('\n📤 Payload enviado:');
    console.log(JSON.stringify(payload, null, 2));

    const headers = {
      'Content-Type': 'application/json',
    };

    if (WEBHOOK_TOKEN) {
      headers['X-Webhook-Token'] = WEBHOOK_TOKEN;
      console.log('\n🔐 Token de autenticação incluído');
    } else {
      console.log('\n⚠️ ASAAS_WEBHOOK_TOKEN não configurado - testando sem autenticação');
    }

    const response = await axios.post(
      `${API_BASE_URL}/api/webhooks/asaas`,
      payload,
      { headers }
    );

    console.log('\n✅ Resposta do servidor:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('\n❌ Erro ao testar webhook:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

async function testWebhookEndpoint() {
  try {
    console.log('\n🔍 Verificando se o endpoint existe...');
    const response = await axios.get(`${API_BASE_URL}/api/webhooks/asaas/test`);
    console.log('✅ Endpoint configurado:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Endpoint não acessível:', error.message);
    console.error('Certifique-se de que o servidor backend está rodando!');
    return false;
  }
}

async function runTests() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║       TESTE DO WEBHOOK ASAAS - POINT55                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\n🌐 API Base URL: ${API_BASE_URL}`);
  console.log(`🔐 Webhook Token: ${WEBHOOK_TOKEN ? '✓ Configurado' : '✗ Não configurado'}`);

  // Verificar se endpoint existe
  const endpointOk = await testWebhookEndpoint();
  if (!endpointOk) {
    console.log('\n❌ Servidor não está rodando. Execute: npm run dev');
    process.exit(1);
  }

  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Testar todos os eventos
  const events = [
    'PAYMENT_CREATED',
    'PAYMENT_CONFIRMED',
    'PAYMENT_RECEIVED',
    'PAYMENT_OVERDUE',
    'PAYMENT_REFUNDED',
  ];

  for (const event of events) {
    await testWebhook(event);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Todos os testes concluídos!');
  console.log('='.repeat(60));
  console.log('\n💡 Próximos passos:');
  console.log('1. Verifique os logs do backend');
  console.log('2. Consulte o banco de dados para ver se os status foram atualizados');
  console.log('3. Configure o webhook no painel Asaas (sandbox ou produção)');
  console.log('\n📚 Documentação: https://docs.asaas.com/reference/webhooks\n');
}

// Executar testes
runTests().catch(console.error);
