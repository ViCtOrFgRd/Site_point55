const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'point55',
  password: '140119',
  port: 5432
});

async function verificarImagens() {
  try {
    // Contar produtos sem imagens
    const semImagens = await pool.query(`
      SELECT COUNT(*) as total 
      FROM produtos 
      WHERE ativo = true AND (imagens IS NULL OR imagens = '{}' OR array_length(imagens, 1) = 0)
    `);
    
    console.log('Produtos sem imagens:', semImagens.rows[0].total);
    
    // Listar alguns produtos sem imagens
    if (parseInt(semImagens.rows[0].total) > 0) {
      const produtos = await pool.query(`
        SELECT id, nome 
        FROM produtos 
        WHERE ativo = true AND (imagens IS NULL OR imagens = '{}' OR array_length(imagens, 1) = 0)
        LIMIT 10
      `);
      
      console.log('\nExemplos de produtos sem imagens:');
      produtos.rows.forEach(p => {
        console.log(`  ${p.id} - ${p.nome}`);
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

verificarImagens();
