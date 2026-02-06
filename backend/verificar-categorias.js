const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '140119',
  database: 'point55',
  port: 5432
});

async function verificarCategorias() {
  try {
    console.log('📋 VERIFICANDO CATEGORIAS NO BANCO\n');

    const result = await pool.query(`
      SELECT id, nome, slug, ativa
      FROM categorias
      ORDER BY id ASC
    `);

    console.log('Categorias encontradas:\n');
    result.rows.forEach((cat) => {
      console.log(`ID: ${cat.id.toString().padEnd(3)} | Nome: ${cat.nome.padEnd(30)} | Slug: ${cat.slug.padEnd(20)} | Ativa: ${cat.ativa ? '✅' : '❌'}`);
    });

    console.log('\n\n🔍 Procurando por categorias com "feminino" ou "masculino":\n');
    
    const femininoMasculino = result.rows.filter(cat => 
      cat.slug.includes('feminino') || cat.slug.includes('masculino') || 
      cat.nome.toLowerCase().includes('feminino') || cat.nome.toLowerCase().includes('masculino')
    );

    if (femininoMasculino.length > 0) {
      femininoMasculino.forEach((cat) => {
        console.log(`✅ ENCONTRADO: "${cat.nome}" (slug: "${cat.slug}", id: ${cat.id})`);
      });
    } else {
      console.log('❌ Nenhuma categoria com "feminino" ou "masculino" encontrada!');
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
  }
}

verificarCategorias();
