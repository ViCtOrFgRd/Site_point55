const { pool } = require('./config/database');

async function verificarEstoqueZero() {
  try {
    const result = await pool.query(
      'SELECT id, nome, estoque FROM produtos WHERE estoque = 0 ORDER BY id'
    );
    
    console.log(`\nProdutos com estoque 0: ${result.rows.length}\n`);
    
    result.rows.forEach(p => {
      console.log(`ID: ${p.id} | Nome: ${p.nome} | Estoque: ${p.estoque}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

verificarEstoqueZero();
