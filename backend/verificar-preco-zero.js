require('dotenv').config();
const { pool } = require('./config/database');

async function verificarProdutosPrecoZero() {
  try {
    console.log('=== VERIFICAÇÃO DE PRODUTOS COM PREÇO ZERO ===\n');

    // 1. Total de produtos com preço zero
    const produtosPrecoZero = await pool.query(
      'SELECT COUNT(*) FROM produtos WHERE ativo = true AND estoque > 0 AND preco = 0'
    );
    console.log('1. Produtos com preço R$ 0,00:', produtosPrecoZero.rows[0].count);

    // 2. Listar produtos com preço zero
    const listaProdutosZero = await pool.query(
      'SELECT id, nome, preco, estoque FROM produtos WHERE ativo = true AND estoque > 0 AND preco = 0 LIMIT 10'
    );
    if (listaProdutosZero.rows.length > 0) {
      console.log('\n2. Exemplos de produtos com preço zero:');
      listaProdutosZero.rows.forEach(p => {
        console.log(`   - ID ${p.id}: ${p.nome || '(sem nome)'} - R$ ${p.preco} - Estoque: ${p.estoque}`);
      });
    }

    // 3. Total de produtos válidos (com preço > 0)
    const produtosValidos = await pool.query(
      'SELECT COUNT(*) FROM produtos WHERE ativo = true AND estoque > 0 AND preco > 0'
    );
    console.log('\n3. Total de produtos VÁLIDOS (preço > 0):', produtosValidos.rows[0].count);

    // 4. Simulação da nova query (após a correção)
    console.log('\n4. Simulando nova query da API (com filtro preço > 0):');
    const novaQuery = await pool.query(`
      SELECT COUNT(*) as total,
             MIN(preco) as menor_preco,
             MAX(preco) as maior_preco,
             AVG(preco) as preco_medio
      FROM produtos 
      WHERE ativo = true AND estoque > 0 AND preco > 0
    `);
    const stats = novaQuery.rows[0];
    console.log(`   Total: ${stats.total}`);
    console.log(`   Menor preço: R$ ${parseFloat(stats.menor_preco).toFixed(2)}`);
    console.log(`   Maior preço: R$ ${parseFloat(stats.maior_preco).toFixed(2)}`);
    console.log(`   Preço médio: R$ ${parseFloat(stats.preco_medio).toFixed(2)}`);

    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarProdutosPrecoZero();
