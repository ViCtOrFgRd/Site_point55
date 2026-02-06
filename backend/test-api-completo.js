require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testarAPI() {
  console.log('=== TESTE COMPLETO DA API DE PRODUTOS ===\n');

  try {
    // 1. Testar conexão
    console.log('1. Testando conexão com API...');
    const health = await axios.get('http://localhost:5000/health');
    console.log('   ✅ API está online:', health.data.message);

    // 2. Listar TODOS os produtos (sem filtros)
    console.log('\n2. Buscando TODOS os produtos (sem filtros)...');
    const todosResponse = await axios.get(`${API_URL}/produtos?limite=1000`);
    console.log(`   ✅ Total de produtos: ${todosResponse.data.total}`);
    console.log(`   ✅ Produtos retornados: ${todosResponse.data.count}`);
    console.log(`   ✅ Página: ${todosResponse.data.pagina} de ${todosResponse.data.totalPaginas}`);

    // 3. Testar paginação
    console.log('\n3. Testando paginação (página 1, limite 20)...');
    const pag1 = await axios.get(`${API_URL}/produtos?pagina=1&limite=20`);
    console.log(`   ✅ Produtos na página 1: ${pag1.data.count}`);

    // 4. Testar filtro por categoria
    console.log('\n4. Testando filtro por categoria...');
    const categorias = await axios.get(`${API_URL}/categorias`);
    if (categorias.data.data && categorias.data.data.length > 0) {
      const primeiraCategoria = categorias.data.data.find(c => c.nome !== 'Calçados');
      if (primeiraCategoria) {
        const porCategoria = await axios.get(`${API_URL}/produtos?categoria=${primeiraCategoria.id}`);
        console.log(`   ✅ Categoria "${primeiraCategoria.nome}": ${porCategoria.data.total} produtos`);
      }
    }

    // 5. Testar busca
    console.log('\n5. Testando busca por "NIKE"...');
    const busca = await axios.get(`${API_URL}/produtos?busca=NIKE`);
    console.log(`   ✅ Produtos encontrados: ${busca.data.total}`);

    // 6. Testar filtro de preço
    console.log('\n6. Testando filtro de preço (min: 50, max: 100)...');
    const porPreco = await axios.get(`${API_URL}/produtos?precoMin=50&precoMax=100`);
    console.log(`   ✅ Produtos na faixa de preço: ${porPreco.data.total}`);

    // 7. Testar ordenação
    console.log('\n7. Testando ordenação (menor preço)...');
    const ordenado = await axios.get(`${API_URL}/produtos?ordem=preco&direcao=ASC&limite=5`);
    console.log(`   ✅ Primeiros 5 produtos (menor preço):`);
    ordenado.data.data.forEach((p, i) => {
      console.log(`      ${i+1}. ${p.nome} - R$ ${p.preco}`);
    });

    console.log('\n✅ TODOS OS TESTES PASSARAM COM SUCESSO!');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Dados:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   ⚠️  O servidor backend não está rodando na porta 5000!');
      console.error('   Execute: cd backend && node server.js');
    }
  }
}

testarAPI();
