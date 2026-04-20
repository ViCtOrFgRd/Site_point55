require('dotenv').config();
const axios = require('axios');

const PRIMARY_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
const PRIMARY_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'password123';
const FALLBACK_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL_ALT || 'admin2@example.com';
const FALLBACK_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD_ALT || 'password123';

// Criar instância da API
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  validateStatus: () => true // Não throw em erros HTTP
});

async function testarAtualizacao() {
  try {
    console.log('🔐 Teste de Atualização com Autenticação\n');

    // Passo 1: Fazer login com admin
    console.log('1️⃣ Fazendo login como admin...');
    const loginResp = await api.post('/auth/login', {
      email: PRIMARY_ADMIN_EMAIL,
      senha: PRIMARY_ADMIN_PASSWORD,
    });

    if (!loginResp.data.success) {
      console.log('❌ Falha no login:', loginResp.data.error);
      console.log('   Tentando com outro email/senha...\n');
      
      // Tentar com outro admin
      const loginResp2 = await api.post('/auth/login', {
        email: FALLBACK_ADMIN_EMAIL,
        senha: FALLBACK_ADMIN_PASSWORD,
      });
      
      if (!loginResp2.data.success) {
        console.log('❌ Falha no segundo login também:', loginResp2.data.error);
        console.log('\n⚠️ Precisa de credenciais admin válidas. Verifique o banco de dados.');
        return;
      }
    }

    const token = loginResp.data.data?.token || loginResp.data.token;
    if (!token) {
      console.log('❌ Token não retornado. Resposta:', loginResp.data);
      return;
    }

    console.log('✅ Login bem-sucedido!');
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Configurar header de autenticação
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Passo 2: Buscar um produto
    console.log('\n2️⃣ Buscando um produto para testar...');
    const produtosResp = await api.get('/produtos?limite=1');
    
    if (!produtosResp.data.data || produtosResp.data.data.length === 0) {
      console.log('❌ Nenhum produto encontrado');
      return;
    }

    const produto = produtosResp.data.data[0];
    console.log(`✅ Produto encontrado:`);
    console.log(`   ID: ${produto.id}`);
    console.log(`   Nome: ${produto.nome}`);
    console.log(`   Preço: ${produto.preco}`);
    console.log(`   Preço Original: ${produto.preco_original}`);

    // Passo 3: Teste 1 - Atualizar apenas nome
    console.log('\n3️⃣ Teste 1: Atualizar apenas NOME');
    const data1 = {
      nome: 'Teste Atualização ' + new Date().getTime()
    };
    
    const resp1 = await api.put(`/produtos/${produto.id}`, data1);
    if (resp1.data.success) {
      console.log('✅ Sucesso!');
      console.log(`   Novo nome: ${resp1.data.data.nome}`);
    } else {
      console.log('❌ Erro:', resp1.data.error);
    }

    // Passo 4: Teste 2 - Atualizar nome + preço
    console.log('\n4️⃣ Teste 2: Atualizar NOME + PREÇO');
    const data2 = {
      nome: 'Teste com Preço ' + new Date().getTime(),
      preco: 99.99
    };
    
    const resp2 = await api.put(`/produtos/${produto.id}`, data2);
    if (resp2.data.success) {
      console.log('✅ Sucesso!');
      console.log(`   Novo nome: ${resp2.data.data.nome}`);
      console.log(`   Novo preço: ${resp2.data.data.preco}`);
    } else {
      console.log('❌ Erro:', resp2.data.error);
    }

    // Passo 5: Teste 3 - Atualizar com preco_original
    console.log('\n5️⃣ Teste 3: Atualizar com PREÇO ORIGINAL');
    const data3 = {
      nome: 'Teste com Preço Original',
      preco: 79.99,
      preco_original: 149.99
    };
    
    const resp3 = await api.put(`/produtos/${produto.id}`, data3);
    if (resp3.data.success) {
      console.log('✅ Sucesso!');
      console.log(`   Nome: ${resp3.data.data.nome}`);
      console.log(`   Preço: ${resp3.data.data.preco}`);
      console.log(`   Preço Original: ${resp3.data.data.preco_original}`);
    } else {
      console.log('❌ Erro:', resp3.data.error);
    }

    // Passo 6: Teste 4 - Atualizar com preco_original = null
    console.log('\n6️⃣ Teste 4: Atualizar com PREÇO ORIGINAL = null');
    const data4 = {
      preco: 59.99,
      preco_original: null
    };
    
    const resp4 = await api.put(`/produtos/${produto.id}`, data4);
    if (resp4.data.success) {
      console.log('✅ Sucesso!');
      console.log(`   Preço: ${resp4.data.data.preco}`);
      console.log(`   Preço Original: ${resp4.data.data.preco_original}`);
    } else {
      console.log('❌ Erro:', resp4.data.error);
    }

    console.log('\n✅ Testes concluídos!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testarAtualizacao();
