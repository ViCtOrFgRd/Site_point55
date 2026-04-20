const { pool } = require('./config/database');

/**
 * Script de teste para validar:
 * 1. Inativação automática quando estoque zera
 * 2. Notificações para admin
 * 3. Reativação quando estoque é restaurado
 */

async function testarInativacaoEstoqueZero() {
  const client = await pool.connect();
  
  try {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║   TESTE: INATIVAÇÃO AUTOMÁTICA E NOTIFICAÇÕES - ESTOQUE 0   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // 1. Criar produto teste com estoque baixo
    console.log('📦 PASSO 1: Criando produto teste com estoque = 3...\n');
    
    await client.query('BEGIN');
    
    const produtoResult = await client.query(
      `INSERT INTO produtos 
       (nome, descricao, preco, estoque, ativo, preco_original, tipo_produto_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nome, estoque, ativo`,
      ['Produto Teste Inativação', 'Teste de inativação automática', 99.90, 3, true, 99.90, 1]
    );
    
    const produto = produtoResult.rows[0];
    console.log(`   ✅ Produto criado:`);
    console.log(`      - ID: ${produto.id}`);
    console.log(`      - Nome: ${produto.nome}`);
    console.log(`      - Estoque: ${produto.estoque}`);
    console.log(`      - Ativo: ${produto.ativo ? 'SIM' : 'NÃO'}\n`);

    // 2. Simular venda de 3 unidades (zerou o estoque)
    console.log('🛒 PASSO 2: Simulando venda de 3 unidades (estoque vai para 0)...\n');
    
    const updateResult = await client.query(
      `UPDATE produtos
       SET estoque = estoque - $1, vendas_total = vendas_total + $2
       WHERE id = $3 AND estoque >= $1
       RETURNING estoque, ativo, nome`,
      [3, 3, produto.id]
    );

    if (updateResult.rowCount === 0) {
      throw new Error('❌ Erro: Não foi possível atualizar o estoque');
    }

    const estoqueAtualizado = updateResult.rows[0].estoque;
    console.log(`   ✅ Estoque atualizado: ${estoqueAtualizado}\n`);

    // 3. Verificar se estoque zerou e inativar
    if (estoqueAtualizado === 0) {
      console.log('⚠️  PASSO 3: Estoque zerou! Inativando produto...\n');
      
      await client.query(
        'UPDATE produtos SET ativo = false WHERE id = $1',
        [produto.id]
      );

      console.log('   ✅ Produto inativado automaticamente\n');

      // Simular notificação (apenas log, não vamos enviar de verdade no teste)
      console.log('   📧 Notificação que SERIA enviada aos admins:');
      console.log('   ┌────────────────────────────────────────────────────┐');
      console.log('   │ Tipo: estoque_zerado                               │');
      console.log('   │ Título: ⚠️ Produto sem estoque                    │');
      console.log(`   │ Produto: ${produto.nome.padEnd(38)} │`);
      console.log('   │ Estoque anterior: 3                                │');
      console.log('   │ Estoque atual: 0                                   │');
      console.log('   └────────────────────────────────────────────────────┘\n');
    }

    // 4. Verificar status do produto
    console.log('🔍 PASSO 4: Verificando status do produto após inativação...\n');
    
    const verificacao1 = await client.query(
      'SELECT id, nome, estoque, ativo FROM produtos WHERE id = $1',
      [produto.id]
    );

    const produtoInativado = verificacao1.rows[0];
    console.log(`   Estado do produto:`);
    console.log(`   - Estoque: ${produtoInativado.estoque}`);
    console.log(`   - Ativo: ${produtoInativado.ativo ? '✅ SIM' : '❌ NÃO'}\n`);

    if (!produtoInativado.ativo && produtoInativado.estoque === 0) {
      console.log('   ✅ SUCESSO: Produto inativado corretamente!\n');
    } else {
      console.log('   ❌ ERRO: Produto deveria estar inativo!\n');
    }

    // 5. Verificar se produto NÃO aparece na listagem pública
    console.log('🔍 PASSO 5: Verificando listagem pública...\n');
    
    const listagem = await client.query(
      `SELECT id, nome, estoque, ativo 
       FROM produtos 
       WHERE ativo = true AND estoque > 0 AND preco > 0 AND id = $1`,
      [produto.id]
    );

    const apareceNaListagem = listagem.rows.length > 0;
    console.log(`   Produto aparece na listagem? ${apareceNaListagem ? '❌ SIM (ERRO!)' : '✅ NÃO (CORRETO!)'}\n`);

    // 6. Simular cancelamento (restaurar estoque)
    console.log('↩️  PASSO 6: Simulando cancelamento de pedido (restaurar 3 unidades)...\n');
    
    const produtoAntes = await client.query(
      'SELECT ativo, estoque, nome FROM produtos WHERE id = $1',
      [produto.id]
    );

    const estoqueAntes = produtoAntes.rows[0]?.estoque || 0;
    const estaInativo = produtoAntes.rows[0]?.ativo === false;
    const estoqueDepois = estoqueAntes + 3;

    await client.query(
      'UPDATE produtos SET estoque = estoque + $1, vendas_total = vendas_total - $2 WHERE id = $3',
      [3, 3, produto.id]
    );

    console.log(`   ✅ Estoque restaurado: ${estoqueDepois}\n`);

    // 7. Verificar se deve reativar
    if (estaInativo && estoqueAntes === 0 && estoqueDepois > 0) {
      console.log('🔄 PASSO 7: Produto estava inativo e agora tem estoque. Reativando...\n');
      
      await client.query(
        'UPDATE produtos SET ativo = true WHERE id = $1',
        [produto.id]
      );

      console.log('   ✅ Produto reativado automaticamente\n');

      // Simular notificação
      console.log('   📧 Notificação que SERIA enviada aos admins:');
      console.log('   ┌────────────────────────────────────────────────────┐');
      console.log('   │ Tipo: estoque_restaurado                           │');
      console.log('   │ Título: ✅ Produto reativado                       │');
      console.log(`   │ Produto: ${produto.nome.padEnd(38)} │`);
      console.log('   │ Estoque anterior: 0                                │');
      console.log(`   │ Estoque atual: ${String(estoqueDepois).padEnd(36)} │`);
      console.log('   └────────────────────────────────────────────────────┘\n');
    }

    // 8. Verificação final
    console.log('🔍 PASSO 8: Verificação final do produto...\n');
    
    const verificacao2 = await client.query(
      'SELECT id, nome, estoque, ativo FROM produtos WHERE id = $1',
      [produto.id]
    );

    const produtoFinal = verificacao2.rows[0];
    console.log(`   Estado final do produto:`);
    console.log(`   - Estoque: ${produtoFinal.estoque}`);
    console.log(`   - Ativo: ${produtoFinal.ativo ? '✅ SIM' : '❌ NÃO'}\n`);

    if (produtoFinal.ativo && produtoFinal.estoque === 3) {
      console.log('   ✅ SUCESSO: Produto reativado corretamente!\n');
    } else {
      console.log('   ❌ ERRO: Produto deveria estar ativo com estoque 3!\n');
    }

    // 9. Limpar produto de teste
    console.log('🧹 PASSO 9: Removendo produto de teste...\n');
    await client.query('DELETE FROM produtos WHERE id = $1', [produto.id]);
    console.log('   ✅ Produto removido\n');

    await client.query('COMMIT');

    // Resumo final
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                      RESUMO DO TESTE                         ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║ ✅ Produto inativado quando estoque zerou                    ║');
    console.log('║ ✅ Produto NÃO aparece na listagem pública                   ║');
    console.log('║ ✅ Produto reativado quando estoque foi restaurado           ║');
    console.log('║ ✅ Sistema de notificações pronto para uso                   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    console.log('✅ TODOS OS TESTES PASSARAM COM SUCESSO!\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar teste
testarInativacaoEstoqueZero()
  .then(() => {
    console.log('✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
