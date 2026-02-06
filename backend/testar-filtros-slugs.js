const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testarFiltros() {
  try {
    console.log('🧪 TESTANDO FILTROS DE CATEGORIAS\n');

    // Teste 1: Buscar com slug "roupas-femininas"
    console.log('1️⃣ Testando slug "roupas-femininas":');
    try {
      const resp1 = await axios.get(`${API_BASE}/produtos?categoria=roupas-femininas&limite=3`);
      console.log(`   ✅ Sucesso: ${resp1.data.data?.length || 0} produtos encontrados\n`);
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}\n`);
    }

    // Teste 2: Buscar com slug "roupas-masculinas"
    console.log('2️⃣ Testando slug "roupas-masculinas":');
    try {
      const resp2 = await axios.get(`${API_BASE}/produtos?categoria=roupas-masculinas&limite=3`);
      console.log(`   ✅ Sucesso: ${resp2.data.data?.length || 0} produtos encontrados\n`);
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}\n`);
    }

    // Teste 3: Buscar com slug "acessorios"
    console.log('3️⃣ Testando slug "acessorios":');
    try {
      const resp3 = await axios.get(`${API_BASE}/produtos?categoria=acessorios&limite=3`);
      console.log(`   ✅ Sucesso: ${resp3.data.data?.length || 0} produtos encontrados\n`);
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}\n`);
    }

    // Teste 4: Buscar com ID numérico 1 (Roupas Femininas)
    console.log('4️⃣ Testando ID numérico "1" (Roupas Femininas):');
    try {
      const resp4 = await axios.get(`${API_BASE}/produtos?categoria=1&limite=3`);
      console.log(`   ✅ Sucesso: ${resp4.data.data?.length || 0} produtos encontrados\n`);
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}\n`);
    }

    // Teste 5: Buscar com ID numérico 2 (Roupas Masculinas)
    console.log('5️⃣ Testando ID numérico "2" (Roupas Masculinas):');
    try {
      const resp5 = await axios.get(`${API_BASE}/produtos?categoria=2&limite=3`);
      console.log(`   ✅ Sucesso: ${resp5.data.data?.length || 0} produtos encontrados\n`);
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}\n`);
    }

    console.log('✨ Testes concluídos!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testarFiltros();
