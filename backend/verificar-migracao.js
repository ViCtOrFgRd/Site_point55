const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '12345678',
  database: 'point55',
  port: 5432
});

async function verificarMigracao() {
  try {
    console.log('🔍 Verificando estado da migração de categorias\n');

    // Passo 1: Contar produtos com categoria_id
    console.log('1️⃣ Contando produtos com categoria_id preenchido...');
    const produtosComCatResult = await pool.query(
      `SELECT COUNT(*) as total FROM produtos WHERE categoria_id IS NOT NULL`
    );
    const produtosComCat = parseInt(produtosComCatResult.rows[0].total);
    console.log(`   ✅ ${produtosComCat} produtos têm categoria_id\n`);

    // Passo 2: Contar registros em produto_categorias
    console.log('2️⃣ Contando registros em produto_categorias...');
    const prodCatResult = await pool.query(
      `SELECT COUNT(*) as total FROM produto_categorias`
    );
    const produtoCategorias = parseInt(prodCatResult.rows[0].total);
    console.log(`   ✅ ${produtoCategorias} registros em produto_categorias\n`);

    // Passo 3: Comparar
    if (produtosComCat > produtoCategorias) {
      console.log('⚠️  ATENÇÃO: Há produtos sem migração!');
      console.log(`   Produtos com categoria_id: ${produtosComCat}`);
      console.log(`   Registros migrados: ${produtoCategorias}`);
      console.log(`   Faltam migrar: ${produtosComCat - produtoCategorias}\n`);
      
      console.log('3️⃣ Executando migração dos produtos restantes...');
      const migracao = await pool.query(`
        INSERT INTO produto_categorias (produto_id, categoria_id)
        SELECT id, categoria_id 
        FROM produtos 
        WHERE categoria_id IS NOT NULL
        ON CONFLICT (produto_id, categoria_id) DO NOTHING
      `);
      console.log(`   ✅ Migraram ${migracao.rowCount} novos registros\n`);
    } else {
      console.log('✅ Todos os produtos já foram migrados!\n');
    }

    // Passo 4: Verificar produtos com múltiplas categorias
    console.log('4️⃣ Buscando produtos com múltiplas categorias...');
    const multiCatResult = await pool.query(`
      SELECT p.id, p.nome, COUNT(DISTINCT pc.categoria_id) as total_categorias
      FROM produtos p
      LEFT JOIN produto_categorias pc ON p.id = pc.produto_id
      GROUP BY p.id
      HAVING COUNT(DISTINCT pc.categoria_id) > 1
      LIMIT 5
    `);
    
    if (multiCatResult.rows.length > 0) {
      console.log(`   ✅ ${multiCatResult.rows.length} produtos com múltiplas categorias:`);
      multiCatResult.rows.forEach(prod => {
        console.log(`      - ${prod.nome} (${prod.total_categorias} categorias)`);
      });
    } else {
      console.log('   ℹ️  Nenhum produto com múltiplas categorias ainda');
    }

    // Passo 5: Exemplo de produto com categorias
    console.log('\n5️⃣ Exemplo: Produto com todas as suas categorias');
    const exemploResult = await pool.query(`
      SELECT 
        p.id, 
        p.nome,
        ARRAY_AGG(c.nome) as categorias
      FROM produtos p
      LEFT JOIN produto_categorias pc ON p.id = pc.produto_id
      LEFT JOIN categorias c ON pc.categoria_id = c.id
      WHERE p.ativo = true AND p.estoque > 0
      GROUP BY p.id
      LIMIT 1
    `);
    
    if (exemploResult.rows.length > 0) {
      const prod = exemploResult.rows[0];
      console.log(`   ${prod.nome}`);
      console.log(`   Categorias: ${prod.categorias.join(', ')}`);
    }

    console.log('\n✨ Verificação concluída!\n');
    await pool.end();

  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
  }
}

verificarMigracao();
