/**
 * Teste direto da API Asaas
 */
require('dotenv').config();
const axios = require('axios');

const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_TOKEN = process.env.ASAAS_TOKEN;
const ASAAS_AUTH_HEADER = process.env.ASAAS_AUTH_HEADER || 'access_token';

console.log('🔧 Configuração:');
console.log('ASAAS_BASE_URL:', ASAAS_BASE_URL);
console.log('ASAAS_TOKEN:', ASAAS_TOKEN ? ASAAS_TOKEN.substring(0, 20) + '...' : 'NÃO DEFINIDO');
console.log('ASAAS_AUTH_HEADER:', ASAAS_AUTH_HEADER);
console.log('');

async function testarListarClientes() {
  try {
    console.log('📋 Testando: Listar clientes...');
    const response = await axios.get(`${ASAAS_BASE_URL}/customers`, {
      headers: {
        [ASAAS_AUTH_HEADER]: ASAAS_TOKEN,
      },
    });
    
    console.log('✅ Sucesso! Total de clientes:', response.data.totalCount);
    console.log('Dados:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao listar clientes:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

async function testarCriarCliente() {
  try {
    console.log('\n👤 Testando: Criar cliente...');
    const response = await axios.post(`${ASAAS_BASE_URL}/customers`, {
      name: 'Cliente Teste Webhook',
      email: 'teste@webhook.com',
      cpfCnpj: '37873161838',
      mobilePhone: '11993385579',
    }, {
      headers: {
        [ASAAS_AUTH_HEADER]: ASAAS_TOKEN,
      },
    });
    
    console.log('✅ Cliente criado com sucesso!');
    console.log('ID:', response.data.id);
    console.log('Nome:', response.data.name);
    return response.data.id;
  } catch (error) {
    console.error('❌ Erro ao criar cliente:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    return null;
  }
}

async function testarCriarCobranca(customerId) {
  try {
    console.log('\n💰 Testando: Criar cobrança PIX...');
    const response = await axios.post(`${ASAAS_BASE_URL}/payments`, {
      customer: customerId,
      billingType: 'PIX',
      value: 100.00,
      dueDate: '2026-02-15',
      description: 'Teste de cobrança PIX',
    }, {
      headers: {
        [ASAAS_AUTH_HEADER]: ASAAS_TOKEN,
      },
    });
    
    console.log('✅ Cobrança criada com sucesso!');
    console.log('ID:', response.data.id);
    console.log('Status:', response.data.status);
    console.log('Valor:', response.data.value);
    return response.data.id;
  } catch (error) {
    console.error('❌ Erro ao criar cobrança:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    return null;
  }
}

async function runTests() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║          TESTE DIRETO DA API ASAAS                       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  // 1. Testar listar clientes
  const listaOk = await testarListarClientes();
  if (!listaOk) {
    console.log('\n❌ Token inválido ou erro de configuração!');
    console.log('Verifique se ASAAS_TOKEN está correto no .env\n');
    return;
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 2. Criar cliente
  const customerId = await testarCriarCliente();
  if (!customerId) {
    console.log('\n❌ Não foi possível criar cliente\n');
    return;
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 3. Criar cobrança
  const paymentId = await testarCriarCobranca(customerId);
  if (!paymentId) {
    console.log('\n❌ Não foi possível criar cobrança\n');
    return;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ TODOS OS TESTES PASSARAM!');
  console.log('A API Asaas está funcionando corretamente');
  console.log('='.repeat(60) + '\n');
}

runTests().catch(console.error);
