const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '140119',
  database: 'point55',
  port: 5432
});

async function debug() {
  try {
    console.log('🔍 Estrutura da tabela promocoes:\n');

    // Ver colunas da tabela
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'promocoes'
      ORDER BY ordinal_position
    `);

    result.rows.forEach((col, idx) => {
      console.log(`${idx + 1}. ${col.column_name.padEnd(25)} | ${col.data_type}`);
    });

    // Ver alguns registros
    console.log('\n\n📊 Exemplos de registros:\n');
    const promos = await pool.query('SELECT * FROM promocoes WHERE ativa = true LIMIT 3');
    
    if (promos.rows.length > 0) {
      const promo = promos.rows[0];
      console.log('Colunas e valores do primeiro registro:');
      Object.entries(promo).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    }

    // Verificar relacionamento com produtos
    console.log('\n\n🔗 Verificando relacionamento com produtos:\n');
    const relacao = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM promocoes) as total_promocoes,
        (SELECT COUNT(*) FROM promocoes WHERE ativa = true) as promocoes_ativas,
        (SELECT COUNT(DISTINCT produto_id) FROM promocoes WHERE ativa = true) as produtos_unicos,
        (SELECT COUNT(*) FROM produtos p 
          WHERE p.id IN (SELECT produto_id FROM promocoes WHERE ativa = true)
        ) as produtos_existentes
    `);

    const row = relacao.rows[0];
    console.log(`Total de promoções: ${row.total_promocoes}`);
    console.log(`Promoções ativas: ${row.promocoes_ativas}`);
    console.log(`Produtos únicos com promoção: ${row.produtos_unicos}`);
    console.log(`Produtos existentes: ${row.produtos_existentes}`);

    // Query para ver como está o JOIN
    console.log('\n\n✅ Query test - Produtos com promoção:\n');
    const test = await pool.query(`
      SELECT 
        p.id,
        p.nome,
        STRING_AGG(DISTINCT c.nome, ', ') as categorias,
        COUNT(DISTINCT pr.id) as num_promocoes
      FROM produtos p
      LEFT JOIN produto_categorias pc ON p.id = pc.produto_id
      LEFT JOIN categorias c ON pc.categoria_id = c.id
      LEFT JOIN promocoes pr ON p.id = pr.produto_id AND pr.ativa = true
      WHERE pr.id IS NOT NULL
      GROUP BY p.id, p.nome
      ORDER BY p.id
      LIMIT 5
    `);

    test.rows.forEach((prod, idx) => {
      console.log(`${idx + 1}. ${prod.nome}`);
      console.log(`   ID: ${prod.id} | Categorias: ${prod.categorias || 'NENHUMA'}`);
      console.log(`   Promoções: ${prod.num_promocoes}\n`);
    });

    await pool.end();

  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
  }
}

debug();
