require('dotenv').config();
const { pool } = require('./config/database');

async function testarFiltros() {
  try {
    console.log('=== TESTE DE FILTROS ===\n');

    // 1. Total de produtos ativos
    const totalAtivos = await pool.query(
      'SELECT COUNT(*) FROM produtos WHERE ativo = true'
    );
    console.log('1. Total de produtos ATIVOS:', totalAtivos.rows[0].count);

    // 2. Total de produtos ativos COM estoque > 0
    const totalComEstoque = await pool.query(
      'SELECT COUNT(*) FROM produtos WHERE ativo = true AND estoque > 0'
    );
    console.log('2. Total de produtos ATIVOS com ESTOQUE > 0:', totalComEstoque.rows[0].count);

    // 3. Total de produtos ativos SEM estoque (estoque = 0)
    const totalSemEstoque = await pool.query(
      'SELECT COUNT(*) FROM produtos WHERE ativo = true AND estoque = 0'
    );
    console.log('3. Total de produtos ATIVOS SEM estoque (estoque = 0):', totalSemEstoque.rows[0].count);

    // 4. Verificar alguns produtos sem estoque
    const produtosSemEstoque = await pool.query(
      'SELECT id, nome, estoque, preco FROM produtos WHERE ativo = true AND estoque = 0 LIMIT 10'
    );
    if (produtosSemEstoque.rows.length > 0) {
      console.log('\n4. Exemplos de produtos ATIVOS sem estoque:');
      produtosSemEstoque.rows.forEach(p => {
        console.log(`   - ID ${p.id}: ${p.nome} (Estoque: ${p.estoque}, Preço: R$${p.preco})`);
      });
    } else {
      console.log('\n4. Não há produtos ativos sem estoque');
    }

    // 5. Verificar categorias
    const categorias = await pool.query(
      `SELECT c.id, c.nome, COUNT(p.id) as total_produtos, 
       COUNT(CASE WHEN p.estoque > 0 THEN 1 END) as com_estoque,
       COUNT(CASE WHEN p.estoque = 0 THEN 1 END) as sem_estoque
       FROM categorias c
       LEFT JOIN produtos p ON p.categoria_id = c.id AND p.ativo = true
       GROUP BY c.id, c.nome
       ORDER BY c.nome`
    );
    console.log('\n5. Produtos por categoria:');
    categorias.rows.forEach(c => {
      console.log(`   ${c.nome}: ${c.total_produtos} total (${c.com_estoque} com estoque, ${c.sem_estoque} sem estoque)`);
    });

    // 6. Testar query real da API (simulando)
    const queryAPI = `
      SELECT p.*, c.nome as categoria_nome, c.slug as categoria_slug
      FROM produtos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.ativo = true AND p.estoque > 0
      ORDER BY p.data_criacao DESC
      LIMIT 20
    `;
    const resultadoAPI = await pool.query(queryAPI);
    console.log('\n6. Simulação da query da API (primeiros 20):');
    console.log('   Produtos retornados:', resultadoAPI.rows.length);

    // 7. Testar sem o filtro de estoque
    const querySemFiltroEstoque = `
      SELECT p.*, c.nome as categoria_nome, c.slug as categoria_slug
      FROM produtos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.ativo = true
      ORDER BY p.data_criacao DESC
      LIMIT 20
    `;
    const resultadoSemFiltro = await pool.query(querySemFiltroEstoque);
    console.log('\n7. Query SEM filtro de estoque (primeiros 20):');
    console.log('   Produtos retornados:', resultadoSemFiltro.rows.length);

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
}

testarFiltros();
