const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testarPromocoesComCategoria() {
  try {
    console.log('🧪 Testando listarPromocoes com filtro de categoria\n');

    // Teste 1: Todas as promoções (sem filtro)
    console.log('1️⃣ Todas as promoções (sem filtro):');
    const resp1 = await axios.get(`${API_BASE}/produtos/promocoes?limite=5`);
    console.log(`   ✅ Retornou ${resp1.data.count} produtos`);
    if (resp1.data.data && resp1.data.data[0]) {
      console.log(`   Exemplo: ${resp1.data.data[0].nome} - categorias: ${resp1.data.data[0].categoria_nomes?.join(', ') || 'N/A'}`);
    }

    // Teste 2: Promoções filtradas por ID de categoria (Feminino = 2)
    console.log('\n2️⃣ Promoções para categoria ID=2 (Feminino):');
    const resp2 = await axios.get(`${API_BASE}/produtos/promocoes?categoria=2&limite=5`);
    console.log(`   ✅ Retornou ${resp2.data.count} produtos`);
    if (resp2.data.data && resp2.data.data[0]) {
      console.log(`   Exemplo: ${resp2.data.data[0].nome} - categorias: ${resp2.data.data[0].categoria_nomes?.join(', ') || 'N/A'}`);
    }

    // Teste 3: Promoções filtradas por slug "feminino"
    console.log('\n3️⃣ Promoções para slug "feminino":');
    const resp3 = await axios.get(`${API_BASE}/produtos/promocoes?categoria=feminino&limite=5`);
    console.log(`   ✅ Retornou ${resp3.data.count} produtos`);
    if (resp3.data.data && resp3.data.data[0]) {
      console.log(`   Exemplo: ${resp3.data.data[0].nome} - categorias: ${resp3.data.data[0].categoria_nomes?.join(', ') || 'N/A'}`);
    }

    // Teste 4: Promoções para categoria Masculino (ID=1)
    console.log('\n4️⃣ Promoções para categoria ID=1 (Masculino):');
    const resp4 = await axios.get(`${API_BASE}/produtos/promocoes?categoria=1&limite=5`);
    console.log(`   ✅ Retornou ${resp4.data.count} produtos`);
    if (resp4.data.data && resp4.data.data[0]) {
      console.log(`   Exemplo: ${resp4.data.data[0].nome} - categorias: ${resp4.data.data[0].categoria_nomes?.join(', ') || 'N/A'}`);
    }

    // Teste 5: Promoções para categoria Acessórios (slug)
    console.log('\n5️⃣ Promoções para slug "acessorios":');
    const resp5 = await axios.get(`${API_BASE}/produtos/promocoes?categoria=acessorios&limite=5`);
    console.log(`   ✅ Retornou ${resp5.data.count} produtos`);
    if (resp5.data.data && resp5.data.data[0]) {
      console.log(`   Exemplo: ${resp5.data.data[0].nome} - categorias: ${resp5.data.data[0].categoria_nomes?.join(', ') || 'N/A'}`);
    }

    console.log('\n✅ Todos os testes de promoções por categoria funcionaram!');
  } catch (error) {
    console.error('\n❌ Erro ao testar promoções:', error.response?.data || error.message);
  }
}

testarPromocoesComCategoria();
