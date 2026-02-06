const axios = require('axios');

const baseURL = 'http://localhost:5000/api/produtos';

async function testarFiltros() {
  try {
    console.log('🧪 TESTANDO FILTROS DE PROMOÇÕES\n');

    // Teste 1: Sem filtro
    console.log('1️⃣ GET /produtos/promocoes (sem filtro)');
    try {
      const res1 = await axios.get(`${baseURL}/promocoes`);
      console.log(`   ✅ Status: ${res1.status}`);
      console.log(`   Produtos retornados: ${res1.data.count}`);
      if (res1.data.data && res1.data.data.length > 0) {
        res1.data.data.forEach((prod, idx) => {
          console.log(`   ${idx + 1}. ${prod.nome} (ID: ${prod.id})`);
          console.log(`      Categorias: ${prod.categoria_nomes?.join(', ') || 'Sem categoria'}`);
        });
      }
    } catch (err) {
      console.log(`   ❌ Erro: ${err.message}`);
    }

    // Teste 2: Filtro por categoria Camisas (ID 7)
    console.log('\n2️⃣ GET /produtos/promocoes?categoria=7 (Camisas)');
    try {
      const res2 = await axios.get(`${baseURL}/promocoes?categoria=7`);
      console.log(`   ✅ Status: ${res2.status}`);
      console.log(`   Produtos retornados: ${res2.data.count}`);
      if (res2.data.data && res2.data.data.length > 0) {
        res2.data.data.forEach((prod, idx) => {
          console.log(`   ${idx + 1}. ${prod.nome} (ID: ${prod.id})`);
        });
      } else {
        console.log(`   ⚠️  Nenhum produto encontrado com promoção em Camisas`);
      }
    } catch (err) {
      console.log(`   ❌ Erro: ${err.message}`);
    }

    // Teste 3: Filtro por slug camisas
    console.log('\n3️⃣ GET /produtos/promocoes?categoria=camisas (slug)');
    try {
      const res3 = await axios.get(`${baseURL}/promocoes?categoria=camisas`);
      console.log(`   ✅ Status: ${res3.status}`);
      console.log(`   Produtos retornados: ${res3.data.count}`);
      if (res3.data.data && res3.data.data.length > 0) {
        res3.data.data.forEach((prod, idx) => {
          console.log(`   ${idx + 1}. ${prod.nome} (ID: ${prod.id})`);
        });
      } else {
        console.log(`   ⚠️  Nenhum produto encontrado`);
      }
    } catch (err) {
      console.log(`   ❌ Erro: ${err.message}`);
    }

    // Teste 4: Filtro por categoria Outros (ID 9)
    console.log('\n4️⃣ GET /produtos/promocoes?categoria=9 (Outros)');
    try {
      const res4 = await axios.get(`${baseURL}/promocoes?categoria=9`);
      console.log(`   ✅ Status: ${res4.status}`);
      console.log(`   Produtos retornados: ${res4.data.count}`);
      if (res4.data.data && res4.data.data.length > 0) {
        res4.data.data.forEach((prod, idx) => {
          console.log(`   ${idx + 1}. ${prod.nome} (ID: ${prod.id})`);
        });
      }
    } catch (err) {
      console.log(`   ❌ Erro: ${err.message}`);
    }

    // Teste 5: Filtro por slug outros
    console.log('\n5️⃣ GET /produtos/promocoes?categoria=outros (slug)');
    try {
      const res5 = await axios.get(`${baseURL}/promocoes?categoria=outros`);
      console.log(`   ✅ Status: ${res5.status}`);
      console.log(`   Produtos retornados: ${res5.data.count}`);
      if (res5.data.data && res5.data.data.length > 0) {
        res5.data.data.forEach((prod, idx) => {
          console.log(`   ${idx + 1}. ${prod.nome} (ID: ${prod.id})`);
        });
      }
    } catch (err) {
      console.log(`   ❌ Erro: ${err.message}`);
    }

    // Teste 6: Filtro por categoria Acessórios (ID 3) - que tem muitos produtos
    console.log('\n6️⃣ GET /produtos/promocoes?categoria=3 (Acessórios)');
    try {
      const res6 = await axios.get(`${baseURL}/promocoes?categoria=3`);
      console.log(`   ✅ Status: ${res6.status}`);
      console.log(`   Produtos retornados: ${res6.data.count}`);
      if (res6.data.count === 0) {
        console.log(`   ℹ️  Nenhum produto com promoção em Acessórios`);
      }
    } catch (err) {
      console.log(`   ❌ Erro: ${err.message}`);
    }

    console.log('\n\n✨ Testes concluídos!');

  } catch (error) {
    console.error('Erro geral:', error.message);
  }
}

testarFiltros();
