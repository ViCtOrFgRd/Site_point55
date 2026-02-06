const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'point55',
  password: '140119',
  port: 5432
});

async function checkProdutos() {
  try {
    // Contar produtos ativos
    const countResult = await pool.query('SELECT COUNT(*) as total FROM produtos WHERE ativo=true');
    console.log('Total produtos ativos:', countResult.rows[0].total);
    
    // Listar primeiros produtos
    const produtosResult = await pool.query(`
      SELECT id, nome, preco, imagens, ativo, categoria_id 
      FROM produtos 
      ORDER BY id 
      LIMIT 20
    `);
    
    console.log('\nPrimeiros 20 produtos:');
    produtosResult.rows.forEach(p => {
      const nomeAbrev = p.nome.substring(0, 50);
      const qtdImagens = p.imagens ? p.imagens.length : 0;
      console.log(`${p.id} - ${nomeAbrev} - R$${p.preco} - Imagens: ${qtdImagens} - Ativo: ${p.ativo}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
}

checkProdutos();
