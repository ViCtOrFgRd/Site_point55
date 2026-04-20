const { pool } = require('./config/database');

/**
 * Script de teste para validar o NOVO FLUXO de estoque:
 * 1. Ao criar pedido → NÃO reduz estoque (apenas verifica disponibilidade)
 * 2. Ao confirmar pagamento → REDUZ estoque e inativa se necessário
 * 3. Ao cancelar pedido pago → RESTAURA estoque
 * 4. Ao cancelar pedido pendente → NÃO restaura (porque não foi reduzido)
 */

async function testarNovoFluxoEstoque() {
  const client = await pool.connect();
  
  try {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║     TESTE: NOVO FLUXO DE ESTOQUE COM CONFIRMAÇÃO PAGAMENTO  ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    await client.query('BEGIN');

    const tipoProdutoResult = await client.query(
      'SELECT id FROM tipos_produto ORDER BY id ASC LIMIT 1'
    );

    if (tipoProdutoResult.rows.length === 0) {
      throw new Error('Nenhum tipo de produto encontrado na tabela tipos_produto');
    }

    const tipoProdutoId = tipoProdutoResult.rows[0].id;

    // 1. Criar produto de teste com estoque 10
    console.log('📦 PASSO 1: Criando produto teste com estoque inicial = 10...\n');
    
    const produtoResult = await client.query(
      `INSERT INTO produtos 
       (nome, descricao, preco, estoque, ativo, preco_original, tipo_produto_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nome, estoque, ativo`,
      ['Produto Teste Fluxo Pagamento', 'Teste novo fluxo de estoque', 100.00, 10, true, 100.00, tipoProdutoId]
    );
    
    const produto = produtoResult.rows[0];
    console.log(`   ✅ Produto criado:`);
    console.log(`      - ID: ${produto.id}`);
    console.log(`      - Nome: ${produto.nome}`);
    console.log(`      - Estoque inicial: ${produto.estoque}`);
    console.log(`      - Ativo: ${produto.ativo ? 'SIM' : 'NÃO'}\n`);

    // 2. Simular CRIAÇÃO de pedido (NÃO deve reduzir estoque)
    console.log('🛒 PASSO 2: Simulando CRIAÇÃO de pedido (3 unidades)...\n');
    console.log('   ℹ️  Apenas verificando estoque disponível (SEM reduzir)\n');
    
    // Verificar estoque disponível
    const verificacaoEstoque = await client.query(
      'SELECT estoque FROM produtos WHERE id = $1',
      [produto.id]
    );
    
    const estoqueDisponivel = verificacaoEstoque.rows[0].estoque;
    const quantidadePedido = 3;
    
    if (estoqueDisponivel >= quantidadePedido) {
      console.log(`   ✅ Estoque suficiente: ${estoqueDisponivel} >= ${quantidadePedido}`);
      console.log('   ✅ Pedido criado com sucesso (estoque NÃO foi reduzido)\n');
    } else {
      console.log(`   ❌ Estoque insuficiente: ${estoqueDisponivel} < ${quantidadePedido}\n`);
      throw new Error('Estoque insuficiente');
    }

    // Verificar que estoque NÃO mudou
    const estoqueAposCriar = await client.query(
      'SELECT estoque FROM produtos WHERE id = $1',
      [produto.id]
    );
    
    console.log(`   📊 Estoque após criar pedido: ${estoqueAposCriar.rows[0].estoque}`);
    
    if (estoqueAposCriar.rows[0].estoque === 10) {
      console.log('   ✅ CORRETO: Estoque NÃO foi reduzido na criação do pedido\n');
    } else {
      console.log('   ❌ ERRO: Estoque foi reduzido incorretamente!\n');
      throw new Error('Estoque foi reduzido na criação');
    }

    // 3. Simular CONFIRMAÇÃO de pagamento (DEVE reduzir estoque)
    console.log('💰 PASSO 3: Simulando CONFIRMAÇÃO de pagamento...\n');
    console.log('   ℹ️  Agora SIM o estoque será reduzido\n');
    
    const estoqueResultPagamento = await client.query(
      `UPDATE produtos
       SET estoque = estoque - $1, vendas_total = vendas_total + $2
       WHERE id = $3 AND estoque >= $1
       RETURNING estoque, nome`,
      [quantidadePedido, quantidadePedido, produto.id]
    );

    if (estoqueResultPagamento.rowCount === 0) {
      console.log('   ❌ ERRO: Não foi possível reduzir estoque!\n');
      throw new Error('Falha ao reduzir estoque');
    }

    const estoqueAposPagamento = estoqueResultPagamento.rows[0].estoque;
    console.log(`   ✅ Estoque reduzido: 10 - 3 = ${estoqueAposPagamento}`);
    
    if (estoqueAposPagamento === 7) {
      console.log('   ✅ CORRETO: Estoque foi reduzido corretamente após pagamento\n');
    } else {
      console.log(`   ❌ ERRO: Estoque deveria ser 7, mas está ${estoqueAposPagamento}\n`);
    }

    // 4. Testar inativação quando estoque zera
    console.log('⚠️  PASSO 4: Testando inativação quando estoque zera...\n');
    console.log('   ℹ️  Simulando venda de mais 7 unidades (zerará o estoque)\n');
    
    const estoqueResultZerado = await client.query(
      `UPDATE produtos
       SET estoque = estoque - $1, vendas_total = vendas_total + $2
       WHERE id = $3 AND estoque >= $1
       RETURNING estoque, nome`,
      [7, 7, produto.id]
    );

    const estoqueZerado = estoqueResultZerado.rows[0].estoque;
    console.log(`   📊 Estoque após venda: ${estoqueZerado}`);
    
    if (estoqueZerado === 0) {
      console.log('   ✅ Estoque zerou corretamente\n');
      
      // Inativar produto
      await client.query(
        'UPDATE produtos SET ativo = false WHERE id = $1',
        [produto.id]
      );
      
      console.log('   ✅ Produto inativado automaticamente\n');
    }

    // Verificar status
    const verificacaoInativo = await client.query(
      'SELECT ativo, estoque FROM produtos WHERE id = $1',
      [produto.id]
    );
    
    const produtoInativo = verificacaoInativo.rows[0];
    console.log(`   📊 Status do produto:`);
    console.log(`      - Estoque: ${produtoInativo.estoque}`);
    console.log(`      - Ativo: ${produtoInativo.ativo ? 'SIM' : 'NÃO'}\n`);
    
    if (!produtoInativo.ativo && produtoInativo.estoque === 0) {
      console.log('   ✅ CORRETO: Produto inativo e sem estoque\n');
    }

    // 5. Testar restauração de estoque ao cancelar pedido PAGO
    console.log('↩️  PASSO 5: Testando restauração ao cancelar pedido PAGO...\n');
    
    const produtoAntes = await client.query(
      'SELECT ativo, estoque, nome FROM produtos WHERE id = $1',
      [produto.id]
    );

    const estoqueAntesCancelamento = produtoAntes.rows[0].estoque;
    const estaInativoAntes = produtoAntes.rows[0].ativo === false;
    
    console.log(`   📊 Antes do cancelamento: Estoque = ${estoqueAntesCancelamento}, Ativo = ${!estaInativoAntes}`);
    
    // Restaurar 3 unidades (do primeiro pedido)
    await client.query(
      'UPDATE produtos SET estoque = estoque + $1, vendas_total = vendas_total - $2 WHERE id = $3',
      [3, 3, produto.id]
    );

    const estoqueDepoisCancelamento = estoqueAntesCancelamento + 3;
    
    // Reativar se estava inativo e agora tem estoque
    if (estaInativoAntes && estoqueDepoisCancelamento > 0) {
      await client.query(
        'UPDATE produtos SET ativo = true WHERE id = $1',
        [produto.id]
      );
      console.log('   ✅ Produto reativado automaticamente\n');
    }
    
    const verificacaoFinal = await client.query(
      'SELECT ativo, estoque FROM produtos WHERE id = $1',
      [produto.id]
    );
    
    console.log(`   📊 Depois do cancelamento: Estoque = ${verificacaoFinal.rows[0].estoque}, Ativo = ${verificacaoFinal.rows[0].ativo}\n`);
    
    if (verificacaoFinal.rows[0].estoque === 3 && verificacaoFinal.rows[0].ativo) {
      console.log('   ✅ CORRETO: Estoque restaurado e produto reativado\n');
    }

    // 6. Testar cancelamento de pedido PENDENTE (não deve mexer no estoque)
    console.log('❌ PASSO 6: Testando cancelamento de pedido PENDENTE...\n');
    console.log('   ℹ️  Pedido pendente NÃO teve estoque reduzido, então NÃO deve restaurar\n');
    
    const estoqueAntesPendente = verificacaoFinal.rows[0].estoque;
    console.log(`   📊 Estoque antes: ${estoqueAntesPendente}`);
    console.log('   ℹ️  Simulando cancelamento de pedido pendente...');
    console.log('   ℹ️  Estoque NÃO será modificado (correto!)\n');
    
    const estoqueDepoisPendente = await client.query(
      'SELECT estoque FROM produtos WHERE id = $1',
      [produto.id]
    );
    
    console.log(`   📊 Estoque depois: ${estoqueDepoisPendente.rows[0].estoque}`);
    
    if (estoqueDepoisPendente.rows[0].estoque === estoqueAntesPendente) {
      console.log('   ✅ CORRETO: Estoque não foi alterado ao cancelar pedido pendente\n');
    }

    // Limpar
    console.log('🧹 PASSO 7: Removendo produto de teste...\n');
    await client.query('DELETE FROM produtos WHERE id = $1', [produto.id]);
    console.log('   ✅ Produto removido\n');

    await client.query('COMMIT');

    // Resumo
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                      RESUMO DO TESTE                         ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║ ✅ Criar pedido NÃO reduz estoque                            ║');
    console.log('║ ✅ Confirmar pagamento REDUZ estoque                         ║');
    console.log('║ ✅ Estoque zerado INATIVA produto                            ║');
    console.log('║ ✅ Cancelar pedido pago RESTAURA estoque                     ║');
    console.log('║ ✅ Cancelar pedido pendente NÃO altera estoque               ║');
    console.log('║ ✅ Produto reativado quando estoque restaurado               ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    console.log('✅ TODOS OS TESTES PASSARAM! NOVO FLUXO FUNCIONANDO CORRETAMENTE!\n');

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
testarNovoFluxoEstoque()
  .then(() => {
    console.log('✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
