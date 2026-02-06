const axios = require('axios');

// Token de admin para testes (você precisa ter um usuário admin registrado)
const token = 'seu-token-jwt-aqui'; // Será preciso gerar um token válido

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

async function testarAtualizacaoProduto() {
  try {
    console.log('🧪 Teste de Atualização de Produto com Preço Original\n');

    // Primeiro, vamos buscar um produto existente
    console.log('1️⃣ Buscando um produto existente...');
    const produtosResp = await axios.get('http://localhost:5000/api/produtos?limite=1');
    
    if (!produtosResp.data.data || produtosResp.data.data.length === 0) {
      console.log('❌ Nenhum produto encontrado para testar');
      return;
    }

    const produtoId = produtosResp.data.data[0].id;
    console.log(`✅ Produto encontrado: ID ${produtoId}\n`);

    // Teste 1: Atualizar com preco_original válido
    console.log('2️⃣ Teste 1: Atualizar com preco_original válido');
    const dataComPrecoOriginal = {
      nome: 'Camiseta Teste',
      preco: 50.00,
      preco_original: 99.99,
      desconto_percentual: 50
    };

    try {
      const resp1 = await api.put(`/produtos/${produtoId}`, dataComPrecoOriginal);
      console.log('✅ Sucesso!');
      console.log('   Dados retornados:', resp1.data.data);
    } catch (error) {
      console.log('❌ Erro:', error.response?.data || error.message);
      console.log('   Status:', error.response?.status);
    }

    // Teste 2: Atualizar com preco_original null
    console.log('\n3️⃣ Teste 2: Atualizar com preco_original null');
    const dataSemPrecoOriginal = {
      nome: 'Camiseta Teste 2',
      preco: 50.00,
      preco_original: null
    };

    try {
      const resp2 = await api.put(`/produtos/${produtoId}`, dataSemPrecoOriginal);
      console.log('✅ Sucesso!');
      console.log('   Dados retornados:', resp2.data.data);
    } catch (error) {
      console.log('❌ Erro:', error.response?.data || error.message);
    }

    // Teste 3: Atualizar com preco_original 0
    console.log('\n4️⃣ Teste 3: Atualizar com preco_original 0');
    const dataComPrecoZero = {
      nome: 'Camiseta Teste 3',
      preco: 50.00,
      preco_original: 0
    };

    try {
      const resp3 = await api.put(`/produtos/${produtoId}`, dataComPrecoZero);
      console.log('✅ Sucesso!');
      console.log('   Dados retornados:', resp3.data.data);
    } catch (error) {
      console.log('❌ Erro:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testarAtualizacaoProduto();
