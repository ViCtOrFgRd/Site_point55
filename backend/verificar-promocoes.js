const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '140119',
  database: 'point55',
  port: 5432
});

async function verificar() {
  try {
    console.log('🔍 VERIFICANDO PROMOÇÕES\n');

    // 1. Ver as promoções ativas
    console.log('1️⃣ Promoções ativas:\n');
    const promos = await pool.query(`
      SELECT id, nome, tipo_desconto, desconto_percentual,
             array_length(produtos_aplicaveis, 1) as qtd_produtos,
             data_inicio, data_fim
      FROM promocoes
      WHERE ativa = true
      ORDER BY id
    `);

    if (promos.rows.length === 0) {
      console.log('   ❌ Nenhuma promoção ativa!');
    } else {
      promos.rows.forEach((promo, idx) => {
        console.log(`   ${idx + 1}. ${promo.nome}`);
        console.log(`      Tipo: ${promo.tipo_desconto}`);
        console.log(`      Desconto: ${promo.desconto_percentual}%`);
        console.log(`      Produtos na promoção: ${promo.qtd_produtos || 0}`);
        console.log(`      Período: ${promo.data_inicio} até ${promo.data_fim}\n`);
      });
    }

    // 2. Ver qual produto está na promoção
    console.log('\n2️⃣ Produtos com essa promoção:\n');
    const promoPrincipal = await pool.query(`
      SELECT id, nome, produtos_aplicaveis
      FROM promocoes
      WHERE ativa = true AND produtos_aplicaveis IS NOT NULL
      LIMIT 1
    `);

    if (promoPrincipal.rows.length > 0) {
      const promo = promoPrincipal.rows[0];
      console.log(`   Promoção: ${promo.nome}`);
      console.log(`   Array de produtos: ${promo.produtos_aplicaveis}`);
      
      // Buscar detalhes dos produtos
      const produtosNaPromo = await pool.query(`
        SELECT p.id, p.nome, p.categoria_id,
               STRING_AGG(DISTINCT c.nome, ', ') as categoria_nomes
        FROM produtos p
        LEFT JOIN produto_categorias pc ON p.id = pc.produto_id
        LEFT JOIN categorias c ON pc.categoria_id = c.id
        WHERE p.id = ANY($1)
        GROUP BY p.id, p.nome, p.categoria_id
        LIMIT 5
      `, [promo.produtos_aplicaveis]);

      if (produtosNaPromo.rows.length === 0) {
        console.log('   ⚠️  Array não está vazio, mas nenhum produto encontrado!');
        console.log('   Os IDs no array podem ser inválidos ou produtos deletados');
      } else {
        console.log(`   Produtos encontrados: ${produtosNaPromo.rows.length}\n`);
        produtosNaPromo.rows.forEach((prod, idx) => {
          console.log(`   ${idx + 1}. ID: ${prod.id} | ${prod.nome}`);
          console.log(`      Categorias: ${prod.categoria_nomes || 'Sem categoria'}`);
        });
      }
    }

    // 3. Testar a query de listarPromocoes
    console.log('\n\n3️⃣ Testando query de listarPromocoes:\n');
    const testQuery = `
      SELECT DISTINCT p.id, p.nome,
             ARRAY_AGG(DISTINCT c.nome) as categoria_nomes
      FROM produtos p
      LEFT JOIN produto_categorias pc ON p.id = pc.produto_id
      LEFT JOIN categorias c ON pc.categoria_id = c.id
      WHERE p.ativo = true AND p.estoque > 0 AND (
        p.desconto_percentual > 0 
        OR EXISTS (
          SELECT 1 FROM promocoes 
          WHERE ativa = true
          AND data_inicio <= NOW()
          AND data_fim >= NOW()
          AND (
            produtos_aplicaveis IS NULL 
            OR produtos_aplicaveis = '{}'::integer[] 
            OR p.id = ANY(produtos_aplicaveis)
          )
        )
      )
      GROUP BY p.id, p.nome
      ORDER BY p.id
      LIMIT 10
    `;

    const resultTest = await pool.query(testQuery);
    console.log(`   Produtos encontrados: ${resultTest.rows.length}`);
    if (resultTest.rows.length > 0) {
      resultTest.rows.forEach((prod, idx) => {
        console.log(`   ${idx + 1}. ${prod.nome} (ID: ${prod.id})`);
        console.log(`      Categorias: ${prod.categoria_nomes}`);
      });
    } else {
      console.log('   ❌ Nenhum produto encontrado!');
    }

    // 4. Verificar se há products com desconto direto
    console.log('\n\n4️⃣ Produtos com desconto direto (desconto_percentual > 0):\n');
    const descDirecto = await pool.query(`
      SELECT p.id, p.nome, p.desconto_percentual,
             STRING_AGG(DISTINCT c.nome, ', ') as categorias
      FROM produtos p
      LEFT JOIN produto_categorias pc ON p.id = pc.produto_id
      LEFT JOIN categorias c ON pc.categoria_id = c.id
      WHERE p.ativo = true AND p.estoque > 0 AND p.desconto_percentual > 0
      GROUP BY p.id, p.nome, p.desconto_percentual
      LIMIT 5
    `);

    if (descDirecto.rows.length === 0) {
      console.log('   ❌ Nenhum produto com desconto direto');
    } else {
      console.log(`   Encontrados: ${descDirecto.rows.length}\n`);
      descDirecto.rows.forEach((prod, idx) => {
        console.log(`   ${idx + 1}. ${prod.nome}`);
        console.log(`      Desconto: ${prod.desconto_percentual}%`);
        console.log(`      Categorias: ${prod.categorias}\n`);
      });
    }

    await pool.end();

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
    await pool.end();
  }
}

verificar();
