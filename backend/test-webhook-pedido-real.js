/**
 * Script para criar pedido de teste e simular webhook com payment_id real
 * 
 * Uso: node test-webhook-pedido-real.js
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN;
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'queren@gmail.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'victor123';

console.log('\n🔧 Debug - Variáveis de ambiente:');
console.log('API_BASE_URL:', API_BASE_URL);
console.log('TEST_USER_EMAIL do .env:', process.env.TEST_USER_EMAIL);
console.log('TEST_USER_EMAIL usado:', TEST_USER_EMAIL);
console.log('TEST_USER_PASSWORD do .env:', process.env.TEST_USER_PASSWORD ? '(definido)' : '(VAZIO)');
console.log('TEST_USER_PASSWORD usado:', TEST_USER_PASSWORD);
console.log('');

async function login() {
  try {
    console.log('🔐 Fazendo login...');
    
    const loginData = {
      email: TEST_USER_EMAIL,
      senha: TEST_USER_PASSWORD,  // API espera "senha", não "password"
    };
    
    console.log('📤 Dados enviados:', JSON.stringify(loginData, null, 2));
    console.log('🌐 URL:', `${API_BASE_URL}/api/auth/login`);
    
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, loginData);
    
    console.log('✅ Login realizado com sucesso');
    const token = response.data.data?.token || response.data.token;
    console.log('📥 Token recebido:', token ? 'SIM' : 'NÃO');
    return token;
  } catch (error) {
    console.error('❌ Erro ao fazer login:');
    console.error('   Status:', error.response?.status);
    console.error('   Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('   Message:', error.message);
    throw error;
  }
}

async function buscarEndereco(token) {
  try {
    console.log('\n📍 Buscando endereço do usuário...');
    const response = await axios.get(`${API_BASE_URL}/api/enderecos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.data && response.data.data.length > 0) {
      const endereco = response.data.data[0];
      console.log(`✅ Endereço encontrado: ${endereco.rua}, ${endereco.numero} - ${endereco.cidade}/${endereco.estado}`);
      return endereco.id;
    }
    
    console.log('⚠️ Nenhum endereço encontrado');
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar endereço:', error.response?.data || error.message);
    return null;
  }
}

async function buscarProduto(token) {
  try {
    console.log('\n🛍️ Buscando produto disponível...');
    const response = await axios.get(`${API_BASE_URL}/api/produtos?limite=1&ativo=true`);
    
    if (response.data.data && response.data.data.length > 0) {
      const produto = response.data.data[0];
      console.log(`✅ Produto encontrado: ${produto.nome} - R$ ${produto.preco}`);
      return produto;
    }
    
    console.log('⚠️ Nenhum produto encontrado');
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar produto:', error.response?.data || error.message);
    return null;
  }
}

async function criarPedido(token, enderecoId, produto) {
  try {
    console.log('\n📦 Criando pedido de teste...');
    
    const pedidoData = {
      itens: [{
        produto_id: produto.id,
        quantidade: 1,
        tamanho: 'M',
        cor: 'Azul'
      }],
      endereco_entrega_id: enderecoId,
      forma_pagamento: 'pix',
    };
    
    const response = await axios.post(`${API_BASE_URL}/api/pedidos`, pedidoData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const pedido = response.data.data;
    console.log('✅ Pedido criado com sucesso!');
    console.log(`   ID: ${pedido.id}`);
    console.log(`   Total: R$ ${pedido.total}`);
    console.log(`   Status: ${pedido.status}`);
    console.log(`   Asaas Payment ID: ${pedido.asaas_payment_id || 'N/A'}`);
    
    return pedido;
  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error.response?.data || error.message);
    throw error;
  }
}

async function simularWebhookConfirmacao(paymentId, value) {
  try {
    console.log('\n🔔 Simulando webhook de confirmação de pagamento...');
    
    const payload = {
      event: 'PAYMENT_CONFIRMED',
      payment: {
        id: paymentId,
        customer: 'cus_test_real',
        billingType: 'PIX',
        value: value,
        netValue: value - 1.5,
        status: 'CONFIRMED',
        dueDate: '2026-02-15',
        confirmedDate: new Date().toISOString().split('T')[0],
        paymentDate: new Date().toISOString().split('T')[0],
        description: `Pedido real - Teste`,
      }
    };
    
    console.log('📤 Payload:');
    console.log(JSON.stringify(payload, null, 2));
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Token': WEBHOOK_TOKEN,
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/api/webhooks/asaas`,
      payload,
      { headers }
    );
    
    console.log('\n✅ Webhook processado!');
    console.log('Resposta:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao simular webhook:', error.response?.data || error.message);
    throw error;
  }
}

async function verificarPedidoAtualizado(token, pedidoId) {
  try {
    console.log('\n🔍 Verificando se pedido foi atualizado...');
    
    const response = await axios.get(`${API_BASE_URL}/api/pedidos/${pedidoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const pedido = response.data.data;
    console.log('📊 Status do pedido após webhook:');
    console.log(`   ID: ${pedido.id}`);
    console.log(`   Status: ${pedido.status}`);
    console.log(`   Asaas Payment Status: ${pedido.asaas_payment_status || 'N/A'}`);
    console.log(`   Data Atualização: ${pedido.data_atualizacao}`);
    
    if (pedido.status === 'pago') {
      console.log('\n🎉 SUCESSO! Pedido foi marcado como PAGO!');
    } else {
      console.log(`\n⚠️ Pedido ainda está como: ${pedido.status}`);
    }
    
    return pedido;
  } catch (error) {
    console.error('❌ Erro ao verificar pedido:', error.response?.data || error.message);
    throw error;
  }
}

async function runTest() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║    TESTE WEBHOOK ASAAS COM PEDIDO REAL - POINT55         ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  try {
    // 1. Login
    const token = await login();
    
    // 2. Buscar endereço
    const enderecoId = await buscarEndereco(token);
    if (!enderecoId) {
      console.log('\n❌ Não foi possível encontrar endereço. Crie um endereço primeiro.');
      return;
    }
    
    // 3. Buscar produto
    const produto = await buscarProduto(token);
    if (!produto) {
      console.log('\n❌ Não foi possível encontrar produto ativo.');
      return;
    }
    
    // 4. Criar pedido
    const pedido = await criarPedido(token, enderecoId, produto);
    
    if (!pedido.asaas_payment_id) {
      console.log('\n⚠️ Pedido criado mas sem payment_id do Asaas.');
      console.log('   Forma de pagamento: ', pedido.forma_pagamento);
      console.log('   Talvez o Asaas não esteja configurado corretamente.');
      return;
    }
    
    // Aguardar um pouco
    console.log('\n⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 5. Simular webhook de confirmação
    await simularWebhookConfirmacao(pedido.asaas_payment_id, pedido.total);
    
    // Aguardar um pouco
    console.log('\n⏳ Aguardando 1 segundo...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 6. Verificar se pedido foi atualizado
    await verificarPedidoAtualizado(token, pedido.id);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Teste completo finalizado!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
  }
}

runTest().catch(console.error);
