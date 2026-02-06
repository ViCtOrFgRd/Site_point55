const axios = require('axios');

async function testarFiltroCategoria() {
  try {
    console.log('🔍 Teste de Filtro por Categoria\n');

    // Teste 1: Buscar produtos por slug "masculino"
    console.log('1️⃣ Testando com slug "masculino"...');
    const resp1 = await axios.get('http://localhost:5000/api/produtos?categoria=masculino&limite=5');
    console.log(`✅ ${resp1.data.count} produtos encontrados`);
    if (resp1.data.data && resp1.data.data.length > 0) {
      console.log(`   Primeiro: ${resp1.data.data[0].nome}`);
    }

    // Teste 2: Buscar por slug "feminino"
    console.log('\n2️⃣ Testando com slug "feminino"...');
    const resp2 = await axios.get('http://localhost:5000/api/produtos?categoria=feminino&limite=5');
    console.log(`✅ ${resp2.data.count} produtos encontrados`);
    if (resp2.data.data && resp2.data.data.length > 0) {
      console.log(`   Primeiro: ${resp2.data.data[0].nome}`);
    }

    // Teste 3: Buscar por slug "acessorios"
    console.log('\n3️⃣ Testando com slug "acessorios"...');
    const resp3 = await axios.get('http://localhost:5000/api/produtos?categoria=acessorios&limite=5');
    console.log(`✅ ${resp3.data.count} produtos encontrados`);
    if (resp3.data.data && resp3.data.data.length > 0) {
      console.log(`   Primeiro: ${resp3.data.data[0].nome}`);
    }

    // Teste 4: Buscar todas as categorias para ver os slugs
    console.log('\n4️⃣ Listando todas as categorias...');
    const respCat = await axios.get('http://localhost:5000/api/categorias');
    console.log('✅ Categorias encontradas:');
    respCat.data.data.forEach(cat => {
      console.log(`   - ID: ${cat.id}, Nome: ${cat.nome}, Slug: ${cat.slug}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testarFiltroCategoria();
