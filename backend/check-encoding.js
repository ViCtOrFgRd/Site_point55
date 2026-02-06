const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'point55',
  password: '140119',
  port: 5432
});

async function checkEncoding() {
  try {
    // Verificar encoding do banco
    const encodingResult = await pool.query("SHOW client_encoding");
    console.log('Client Encoding:', encodingResult.rows[0].client_encoding);
    
    const serverResult = await pool.query("SHOW server_encoding");
    console.log('Server Encoding:', serverResult.rows[0].server_encoding);
    
    // Buscar produtos com caracteres especiais
    const produtosResult = await pool.query(`
      SELECT id, nome 
      FROM produtos 
      WHERE nome LIKE '%BON%' OR nome LIKE '%CAL%'
      ORDER BY id 
      LIMIT 20
    `);
    
    console.log('\nExemplos de produtos:');
    produtosResult.rows.forEach(p => {
      console.log(`${p.id} - ${p.nome}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkEncoding();
