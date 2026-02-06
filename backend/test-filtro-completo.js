const axios = require('axios');

async function testarFluxoCompletoDeFiltro() {
  try {
    console.log('📊 TESTE COMPLETO DE FILTRO DE CATEGORIAS\n');

    // Passo 1: Buscar categorias
    console.log('1️⃣ Buscando categorias...');
    const categoriasResp = await axios.get('http://localhost:5000/api/categorias');
    const categorias = categoriasResp.data.data || [];
    console.log(`✅ ${categorias.length} categorias encontradas:\n`);
    
    categorias.forEach(cat => {
      console.log(`   📦 ${cat.nome.padEnd(15)} | ID: ${cat.id} | Slug: ${cat.slug}`);
    });

    // Passo 2: Testar filtro por ID
    console.log('\n2️⃣ Testando filtro por ID (primeira categoria)...');
    if (categorias.length > 0) {
      const primeiraId = categorias[0].id;
      const respID = await axios.get(`http://localhost:5000/api/produtos?categoria=${primeiraId}&limite=3`);
      console.log(`✅ ID=${primeiraId} → ${respID.data.count} produtos`);
    }

    // Passo 3: Testar filtro por SLUG
    console.log('\n3️⃣ Testando filtro por SLUG...');
    const testesSlugs = ['masculino', 'feminino', 'acessorios', 'calcados'];
    
    for (const slug of testesSlugs) {
      try {
        const respSlug = await axios.get(`http://localhost:5000/api/produtos?categoria=${slug}&limite=3`, {
          validateStatus: () => true
        });
        
        if (respSlug.status === 200) {
          console.log(`✅ Slug="${slug.padEnd(12)}" → ${respSlug.data.count} produtos`);
          if (respSlug.data.data && respSlug.data.data.length > 0) {
            console.log(`   └─ Ex: ${respSlug.data.data[0].nome}`);
          }
        } else {
          console.log(`⚠️  Slug="${slug.padEnd(12)}" → Erro ${respSlug.status}`);
        }
      } catch (error) {
        console.log(`❌ Slug="${slug.padEnd(12)}" → ${error.message}`);
      }
    }

    console.log('\n✨ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    if (error.response?.data) {
      console.error('   Resposta:', error.response.data);
    }
  }
}

testarFluxoCompletoDeFiltro();
