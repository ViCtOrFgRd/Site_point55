const { pool } = require('./config/database');

async function verificarStatusProdutos() {
  try {
    console.log('\n=== STATUS DOS PRODUTOS NO BANCO DE DADOS ===\n');
    
    // Total de produtos
    const totalResult = await pool.query('SELECT COUNT(*) FROM produtos');
    console.log(`Total de produtos cadastrados: ${totalResult.rows[0].count}`);
    
    // Produtos ativos
    const ativosResult = await pool.query('SELECT COUNT(*) FROM produtos WHERE ativo = true');
    console.log(`Produtos ativos: ${ativosResult.rows[0].count}`);
    
    // Produtos com estoque 0
    const estoque0Result = await pool.query('SELECT COUNT(*) FROM produtos WHERE estoque = 0');
    console.log(`Produtos com estoque 0: ${estoque0Result.rows[0].count}`);
    
    // Produtos ativos com estoque 0 (que serão ocultos)
    const ativosEstoque0Result = await pool.query(
      'SELECT COUNT(*) FROM produtos WHERE ativo = true AND estoque = 0'
    );
    console.log(`Produtos ativos com estoque 0 (serão ocultos): ${ativosEstoque0Result.rows[0].count}`);
    
    // Produtos visíveis (ativos com estoque > 0)
    const visiveisResult = await pool.query(
      'SELECT COUNT(*) FROM produtos WHERE ativo = true AND estoque > 0'
    );
    console.log(`Produtos visíveis no site: ${visiveisResult.rows[0].count}`);
    
    // Listar produtos com estoque baixo (1-5 unidades)
    const estoqueBaixoResult = await pool.query(
      `SELECT id, nome, estoque FROM produtos 
       WHERE ativo = true AND estoque > 0 AND estoque <= 5 
       ORDER BY estoque ASC`
    );
    
    if (estoqueBaixoResult.rows.length > 0) {
      console.log(`\nProdutos com estoque baixo (1-5 unidades): ${estoqueBaixoResult.rows.length}`);
      estoqueBaixoResult.rows.forEach(p => {
        console.log(`   - ID ${p.id}: ${p.nome} (Estoque: ${p.estoque})`);
      });
    }
    
    // Listar produtos com estoque 0 (se houver)
    const produtosEstoque0 = await pool.query(
      `SELECT id, nome, estoque, ativo FROM produtos 
       WHERE estoque = 0 
       ORDER BY ativo DESC, id ASC`
    );
    
    if (produtosEstoque0.rows.length > 0) {
      console.log(`\n⚠️  Produtos com estoque 0 (ocultos do site):`);
      produtosEstoque0.rows.forEach(p => {
        console.log(`   - ID ${p.id}: ${p.nome} | Ativo: ${p.ativo ? 'Sim' : 'Não'}`);
      });
    } else {
      console.log('\n✓ Nenhum produto com estoque 0');
    }
    
    console.log('\n===========================================\n');
    
    await pool.end();
  } catch (error) {
    console.error('Erro:', error);
    await pool.end();
    process.exit(1);
  }
}

verificarStatusProdutos();
