const axios = require('axios');

async function testarAtualizacao() {
  try {
    console.log('🔍 Teste detalhado de atualização de produto\n');

    // Primeiro, buscar um produto para testar
    console.log('1️⃣ Buscando um produto...');
    const produtosResp = await axios.get('http://localhost:5000/api/produtos?limite=1');
    
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

    // Teste simples: atualizar apenas nome
    console.log('\n2️⃣ Teste 1: Atualizar apenas NOME');
    const data1 = {
      nome: 'Teste de Atualização ' + new Date().getTime()
    };
    
    try {
      const resp = await axios.put(`http://localhost:5000/api/produtos/${produto.id}`, data1);
      console.log('✅ Sucesso!');
      console.log('   Resposta:', resp.data);
    } catch (error) {
      console.log('❌ Erro:', error.response?.data || error.message);
      console.log('   Status:', error.response?.status);
      console.log('   Headers:', error.response?.headers);
    }

    // Teste 2: atualizar nome + preço
    console.log('\n3️⃣ Teste 2: Atualizar NOME + PREÇO');
    const data2 = {
      nome: 'Teste com Preço ' + new Date().getTime(),
      preco: 99.99
    };
    
    try {
      const resp = await axios.put(`http://localhost:5000/api/produtos/${produto.id}`, data2);
      console.log('✅ Sucesso!');
      console.log('   Resposta:', resp.data);
    } catch (error) {
      console.log('❌ Erro:', error.response?.data || error.message);
    }

    // Teste 3: atualizar com preco_original
    console.log('\n4️⃣ Teste 3: Atualizar com PREÇO ORIGINAL');
    const data3 = {
      nome: 'Teste com Preço Original ' + new Date().getTime(),
      preco: 79.99,
      preco_original: 149.99
    };
    
    try {
      const resp = await axios.put(`http://localhost:5000/api/produtos/${produto.id}`, data3);
      console.log('✅ Sucesso!');
      console.log('   Resposta:', resp.data);
    } catch (error) {
      console.log('❌ Erro:', error.response?.data || error.message);
      console.log('   Status:', error.response?.status);
    }

    // Teste 4: atualizar com preco_original = null
    console.log('\n5️⃣ Teste 4: Atualizar com PREÇO ORIGINAL = null');
    const data4 = {
      preco: 59.99,
      preco_original: null
    };
    
    try {
      const resp = await axios.put(`http://localhost:5000/api/produtos/${produto.id}`, data4);
      console.log('✅ Sucesso!');
      console.log('   Resposta:', resp.data);
    } catch (error) {
      console.log('❌ Erro:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testarAtualizacao();
