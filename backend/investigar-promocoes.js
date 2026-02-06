const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '140119',
  database: 'point55',
  port: 5432
});

async function investigar() {
  try {
    console.log('🔍 INVESTIGANDO: Produtos com Promoção\n');

    // Encontrar produtos com promoção
    console.log('1️⃣ Produtos com promoção ativa:');
    const prodPromocao = await pool.query(`
      SELECT DISTINCT p.id, p.nome, STRING_AGG(c.nome, ', ') as categorias
      FROM produtos p
      LEFT JOIN produto_categorias pc ON p.id = pc.produto_id
      LEFT JOIN categorias c ON pc.categoria_id = c.id
      WHERE p.id IN (
        SELECT DISTINCT produto_id FROM promocoes WHERE ativa = true
      )
      GROUP BY p.id, p.nome
      ORDER BY p.id
    `);

    if (prodPromocao.rows.length === 0) {
      console.log('   ❌ Nenhum produto com promoção encontrado!');
    } else {
      prodPromocao.rows.forEach((prod, idx) => {
        console.log(`   ${idx + 1}. ID: ${prod.id} | ${prod.nome.substring(0, 30)}`);
        console.log(`      Categorias: ${prod.categorias || 'NENHUMA'}`);
      });
    }

    // Testar filtros com categorias conhecidas
    console.log('\n2️⃣ Testando filtros com categorias que têm muitos produtos:');
    const categorias = ['Acessórios', 'Tenis', 'Camisas', 'Calcas', 'Outros'];
    
    for (const catNome of categorias) {
      const result = await pool.query(`
        SELECT c.id, c.slug,
          COUNT(DISTINCT p.id) as total,
          COUNT(DISTINCT 
            CASE WHEN p.id IN (SELECT produto_id FROM promocoes WHERE ativa = true) 
            THEN p.id END
          ) as com_promocao
        FROM categorias c
        LEFT JOIN produto_categorias pc ON c.id = pc.categoria_id
        LEFT JOIN produtos p ON pc.produto_id = p.id
        WHERE c.nome = $1 AND p.ativo = true
        GROUP BY c.id, c.slug
      `, [catNome]);

      if (result.rows.length > 0) {
        const cat = result.rows[0];
        console.log(`   ${catNome.padEnd(15)} | Total: ${cat.total} | Com promoção: ${cat.com_promocao}`);
      }
    }

    // Mostrar qual é o único produto com promoção e suas categorias
    console.log('\n3️⃣ Detalhes dos produtos com promoção:');
    const detalhe = await pool.query(`
      SELECT 
        p.id, 
        p.nome,
        p.preco,
        pr.desconto_percentual,
        pr.desconto_valor,
        ARRAY_AGG(DISTINCT c.id) as categoria_ids,
        ARRAY_AGG(DISTINCT c.nome) as categoria_nomes
      FROM produtos p
      LEFT JOIN produto_categorias pc ON p.id = pc.produto_id
      LEFT JOIN categorias c ON pc.categoria_id = c.id
      LEFT JOIN promocoes pr ON p.id = pr.produto_id AND pr.ativa = true
      WHERE pr.id IS NOT NULL
      GROUP BY p.id, p.nome, p.preco, pr.desconto_percentual, pr.desconto_valor
      ORDER BY p.id
    `);

    detalhe.rows.forEach((prod, idx) => {
      console.log(`\n   ${idx + 1}. ${prod.nome}`);
      console.log(`      Preço: R$ ${prod.preco}`);
      console.log(`      Desconto: ${prod.desconto_percentual || prod.desconto_valor}${prod.desconto_percentual ? '%' : ''}`);
      console.log(`      Categorias: ${prod.categoria_nomes.filter(c => c).join(', ') || 'NENHUMA'}`);
    });

    console.log('\n\n💡 SOLUÇÃO:\n');
    
    if (prodPromocao.rows.length > 0) {
      const prod = prodPromocao.rows[0];
      if (!prod.categorias) {
        console.log(`⚠️  O produto "${prod.nome}" NÃO TEM CATEGORIA!`);
        console.log(`   Para testar promoções por categoria, você precisa:`);
        console.log(`   1. Adicionar uma categoria ao produto`);
        console.log(`   2. OU criar promoções para produtos que já têm categoria`);
        console.log(`\n   Opção 1 - Adicionar categoria ao produto com promoção:`);
        console.log(`   INSERT INTO produto_categorias (produto_id, categoria_id) `);
        console.log(`   VALUES (${prod.id}, 3); -- 3 = Acessórios`);
      }
    }

    await pool.end();

  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
  }
}

investigar();
