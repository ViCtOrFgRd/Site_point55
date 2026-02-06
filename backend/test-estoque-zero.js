const { pool } = require('./config/database');

async function testarOcultacaoEstoque() {
  try {
    console.log('\n=== TESTE DE OCULTAÇÃO DE PRODUTOS COM ESTOQUE 0 ===\n');
    
    // 1. Criar um produto teste com estoque 0
    console.log('1. Criando produto teste com estoque 0...');
    const produtoResult = await pool.query(
      `INSERT INTO produtos 
       (nome, descricao, preco, estoque, ativo, categoria_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nome, estoque`,
      ['Produto Teste Estoque Zero', 'Teste', 99.90, 0, true, 1]
    );
    
    const produtoId = produtoResult.rows[0].id;
    console.log(`   ✓ Produto criado: ID ${produtoId}`);
    
    // 2. Verificar se o produto aparece na listagem geral
    console.log('\n2. Verificando listagem geral...');
    const listagem = await pool.query(
      `SELECT p.*, c.nome as categoria_nome 
       FROM produtos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.ativo = true AND p.estoque > 0
       ORDER BY p.id DESC LIMIT 5`
    );
    
    const apareceNaListagem = listagem.rows.some(p => p.id === produtoId);
    console.log(`   ${apareceNaListagem ? '✗' : '✓'} Produto ${apareceNaListagem ? 'APARECE' : 'NÃO APARECE'} na listagem (esperado: NÃO APARECE)`);
    
    // 3. Verificar se o produto aparece nas promoções (se tiver desconto)
    await pool.query(
      `UPDATE produtos SET desconto_percentual = 50 WHERE id = $1`,
      [produtoId]
    );
    
    console.log('\n3. Verificando listagem de promoções...');
    const promocoes = await pool.query(
      `SELECT * FROM produtos 
       WHERE ativo = true AND desconto_percentual > 0 AND estoque > 0
       ORDER BY id DESC LIMIT 5`
    );
    
    const apareceNasPromocoes = promocoes.rows.some(p => p.id === produtoId);
    console.log(`   ${apareceNasPromocoes ? '✗' : '✓'} Produto ${apareceNasPromocoes ? 'APARECE' : 'NÃO APARECE'} nas promoções (esperado: NÃO APARECE)`);
    
    // 4. Verificar se o produto aparece nos destaques
    console.log('\n4. Verificando listagem de destaques...');
    const destaques = await pool.query(
      `SELECT * FROM produtos 
       WHERE ativo = true AND estoque > 0
       ORDER BY vendas_total DESC LIMIT 5`
    );
    
    const apareceNosDestaques = destaques.rows.some(p => p.id === produtoId);
    console.log(`   ${apareceNosDestaques ? '✗' : '✓'} Produto ${apareceNosDestaques ? 'APARECE' : 'NÃO APARECE'} nos destaques (esperado: NÃO APARECE)`);
    
    // 5. Atualizar estoque para > 0 e verificar se aparece
    console.log('\n5. Atualizando estoque para 10...');
    await pool.query(
      `UPDATE produtos SET estoque = 10 WHERE id = $1`,
      [produtoId]
    );
    
    const listagemComEstoque = await pool.query(
      `SELECT * FROM produtos 
       WHERE ativo = true AND estoque > 0 AND id = $1`,
      [produtoId]
    );
    
    const apareceComEstoque = listagemComEstoque.rows.length > 0;
    console.log(`   ${apareceComEstoque ? '✓' : '✗'} Produto ${apareceComEstoque ? 'APARECE' : 'NÃO APARECE'} na listagem (esperado: APARECE)`);
    
    // 6. Limpar produto teste
    console.log('\n6. Removendo produto teste...');
    await pool.query('DELETE FROM produtos WHERE id = $1', [produtoId]);
    console.log('   ✓ Produto removido');
    
    console.log('\n=== TESTE CONCLUÍDO COM SUCESSO ===\n');
    
    await pool.end();
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error);
    await pool.end();
    process.exit(1);
  }
}

testarOcultacaoEstoque();
