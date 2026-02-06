const axios = require('axios');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '140119',
  database: 'point55',
  port: 5432
});

async function diagnosticarPromocoes() {
  try {
    console.log('🔧 DIAGNÓSTICO COMPLETO: Promoções por Categoria\n');

    // Passo 1: Verificar dados no banco
    console.log('📊 Verificando dados no banco de dados...\n');

    // 1.1: Categorias
    console.log('1️⃣ Categorias no banco:');
    const catResult = await pool.query(`
      SELECT id, nome, slug, 
        (SELECT COUNT(*) FROM produto_categorias WHERE categoria_id = categorias.id) as total_produtos
      FROM categorias 
      WHERE ativa = true
      ORDER BY id
    `);
    
    for (const cat of catResult.rows) {
      console.log(`   ${cat.id}. ${cat.nome.padEnd(15)} (${cat.total_produtos} produtos)`);
    }

    // 1.2: Promoções
    console.log('\n2️⃣ Promoções ativas no banco:');
    const promoResult = await pool.query(`
      SELECT id, tipo_desconto, desconto_percentual, desconto_valor, ativa,
        (SELECT COUNT(*) FROM promocoes WHERE ativa = true) as total
      FROM promocoes
      WHERE ativa = true
      LIMIT 5
    `);
    
    if (promoResult.rows.length === 0) {
      console.log('   ⚠️  Nenhuma promoção ativa encontrada!');
    } else {
      console.log(`   Total de promoções ativas: ${promoResult.rows[0].total}`);
      promoResult.rows.forEach((promo, idx) => {
        console.log(`   ${idx + 1}. Tipo: ${promo.tipo_desconto}, Desconto: ${promo.desconto_percentual || promo.desconto_valor}`);
      });
    }

    // 1.3: Produtos com categorias
    console.log('\n3️⃣ Produtos migrados para produto_categorias:');
    const prodResult = await pool.query(`
      SELECT COUNT(DISTINCT p.id) as total_produtos,
        COUNT(DISTINCT pc.produto_id) as produtos_com_categoria
      FROM produtos p
      LEFT JOIN produto_categorias pc ON p.id = pc.produto_id
      WHERE p.ativo = true AND p.estoque > 0 AND p.preco > 0
    `);
    
    const { total_produtos, produtos_com_categoria } = prodResult.rows[0];
    console.log(`   Total de produtos: ${total_produtos}`);
    console.log(`   Produtos com categoria: ${produtos_com_categoria}`);
    console.log(`   Taxa de migração: ${((produtos_com_categoria / total_produtos) * 100).toFixed(1)}%`);

    // Passo 2: Testar API
    console.log('\n\n🌐 Testando API...\n');

    // 2.1: Teste sem filtro
    console.log('4️⃣ GET /api/produtos/promocoes (sem filtro):');
    try {
      const resp1 = await axios.get('http://localhost:5000/api/produtos/promocoes?limite=5');
      console.log(`   ✅ Status: ${resp1.status}`);
      console.log(`   Produtos retornados: ${resp1.data.count}`);
      if (resp1.data.data && resp1.data.data.length > 0) {
        console.log(`   Exemplo: ${resp1.data.data[0].nome}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }

    // 2.2: Teste com categoria ID
    console.log('\n5️⃣ GET /api/produtos/promocoes?categoria=1 (Masculino):');
    try {
      const resp2 = await axios.get('http://localhost:5000/api/produtos/promocoes?categoria=1&limite=5');
      console.log(`   ✅ Status: ${resp2.status}`);
      console.log(`   Produtos retornados: ${resp2.data.count}`);
      if (resp2.data.data && resp2.data.data.length > 0) {
        console.log(`   Exemplo: ${resp2.data.data[0].nome}`);
      } else {
        console.log(`   ⚠️  Nenhum produto com promoção nesta categoria`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }

    // 2.3: Teste com slug
    console.log('\n6️⃣ GET /api/produtos/promocoes?categoria=feminino (Feminino):');
    try {
      const resp3 = await axios.get('http://localhost:5000/api/produtos/promocoes?categoria=feminino&limite=5');
      console.log(`   ✅ Status: ${resp3.status}`);
      console.log(`   Produtos retornados: ${resp3.data.count}`);
      if (resp3.data.data && resp3.data.data.length > 0) {
        console.log(`   Exemplo: ${resp3.data.data[0].nome}`);
      } else {
        console.log(`   ⚠️  Nenhum produto com promoção nesta categoria`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }

    // Passo 3: Insights
    console.log('\n\n💡 INSIGHTS:\n');
    
    if (produtos_com_categoria === 0) {
      console.log('❌ PROBLEMA CRÍTICO: Nenhum produto foi migrado para produto_categorias!');
      console.log('   Solução: Execute no banco:');
      console.log(`   INSERT INTO produto_categorias (produto_id, categoria_id)`);
      console.log(`   SELECT id, categoria_id FROM produtos WHERE categoria_id IS NOT NULL;`);
    } else if (produtos_com_categoria < total_produtos * 0.5) {
      console.log('⚠️  AVISO: Menos de 50% dos produtos foram migrados');
    } else {
      console.log('✅ Produtos migrados com sucesso');
    }

    if (promoResult.rows.length === 0) {
      console.log('❌ Não há promoções ativas no banco. Crie algumas para testar!');
    } else {
      console.log('✅ Há promoções ativas no banco');
    }

    console.log('\n✨ Diagnóstico concluído!\n');
    await pool.end();

  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
  }
}

diagnosticarPromocoes();
