const { pool } = require('./config/database');

/**
 * Script para corrigir produtos que estão com estoque 0 mas ainda ativos
 * Inativa esses produtos e gera relatório
 */

async function corrigirProdutosEstoqueZero() {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║     CORREÇÃO: Produtos com Estoque 0 ainda Ativos           ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // 1. Verificar quantos produtos estão nessa condição
    console.log('🔍 PASSO 1: Verificando produtos com estoque 0 e ativo = true...\n');
    
    const verificacao = await pool.query(
      `SELECT id, nome, estoque, ativo, preco, data_criacao
       FROM produtos
       WHERE estoque = 0 AND ativo = true
       ORDER BY id`
    );

    const produtosParaCorrigir = verificacao.rows;
    const total = produtosParaCorrigir.length;

    console.log(`   📊 Encontrados: ${total} produto(s) com estoque 0 ainda ativos\n`);

    if (total === 0) {
      console.log('   ✅ Nenhuma correção necessária! Todos os produtos estão corretos.\n');
      await pool.end();
      return;
    }

    // 2. Mostrar lista de produtos que serão corrigidos
    console.log('📋 PASSO 2: Lista de produtos que serão inativados:\n');
    console.log('   ┌─────────┬─────────────────────────────────────────┬──────────┐');
    console.log('   │   ID    │ Nome do Produto                         │  Preço   │');
    console.log('   ├─────────┼─────────────────────────────────────────┼──────────┤');
    
    produtosParaCorrigir.slice(0, 10).forEach(p => {
      const id = String(p.id).padEnd(7);
      const nome = p.nome.substring(0, 37).padEnd(37);
      const preco = `R$ ${parseFloat(p.preco).toFixed(2)}`.padStart(8);
      console.log(`   │ ${id} │ ${nome} │ ${preco} │`);
    });
    
    if (total > 10) {
      console.log('   │   ...   │ ... e mais ' + String(total - 10).padEnd(27) + ' │   ...    │');
    }
    
    console.log('   └─────────┴─────────────────────────────────────────┴──────────┘\n');

    // 3. Confirmar ação
    console.log('⚠️  ATENÇÃO: Esta ação irá inativar todos esses produtos!\n');

    // 4. Executar correção
    console.log('🔧 PASSO 3: Inativando produtos...\n');
    
    const resultado = await pool.query(
      `UPDATE produtos
       SET ativo = false, data_atualizacao = NOW()
       WHERE estoque = 0 AND ativo = true
       RETURNING id, nome`
    );

    const produtosInativados = resultado.rows;
    console.log(`   ✅ ${produtosInativados.length} produto(s) inativado(s) com sucesso!\n`);

    // 5. Verificação final
    console.log('🔍 PASSO 4: Verificação final...\n');
    
    const verificacaoFinal = await pool.query(
      `SELECT COUNT(*) as total
       FROM produtos
       WHERE estoque = 0 AND ativo = true`
    );

    const totalRestante = parseInt(verificacaoFinal.rows[0].total);
    
    if (totalRestante === 0) {
      console.log('   ✅ Perfeito! Nenhum produto com estoque 0 está ativo agora.\n');
    } else {
      console.log(`   ⚠️  Ainda existem ${totalRestante} produtos com estoque 0 ativos.\n`);
    }

    // 6. Estatísticas finais
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    RESUMO DA CORREÇÃO                        ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║ Total de produtos corrigidos: ${String(produtosInativados.length).padEnd(28)} ║`);
    console.log(`║ Produtos ainda com estoque 0 ativos: ${String(totalRestante).padEnd(20)} ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // 7. Gerar relatório detalhado
    console.log('📄 PASSO 5: Gerando relatório detalhado...\n');
    
    const relatorio = {
      data_correcao: new Date().toISOString(),
      total_corrigidos: produtosInativados.length,
      produtos: produtosInativados.map(p => ({
        id: p.id,
        nome: p.nome
      }))
    };

    console.log('   Relatório salvo em memória. Produtos corrigidos:');
    console.log(`   ${JSON.stringify(relatorio, null, 2)}\n`);

    // 8. Estatísticas gerais de produtos
    console.log('📊 ESTATÍSTICAS GERAIS DE PRODUTOS:\n');
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE ativo = true AND estoque > 0) as ativos_com_estoque,
        COUNT(*) FILTER (WHERE ativo = false AND estoque = 0) as inativos_sem_estoque,
        COUNT(*) FILTER (WHERE ativo = false AND estoque > 0) as inativos_com_estoque,
        COUNT(*) FILTER (WHERE ativo = true AND estoque = 0) as ativos_sem_estoque,
        COUNT(*) as total
      FROM produtos
    `);

    const st = stats.rows[0];
    console.log(`   ✅ Ativos com estoque: ${st.ativos_com_estoque}`);
    console.log(`   ✅ Inativos sem estoque (correto): ${st.inativos_sem_estoque}`);
    console.log(`   ⚠️  Inativos com estoque (revisar?): ${st.inativos_com_estoque}`);
    console.log(`   ❌ Ativos sem estoque (ERRO!): ${st.ativos_sem_estoque}`);
    console.log(`   📦 Total de produtos: ${st.total}\n`);

    console.log('✅ CORREÇÃO CONCLUÍDA COM SUCESSO!\n');

  } catch (error) {
    console.error('\n❌ ERRO NA CORREÇÃO:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar correção
corrigirProdutosEstoqueZero()
  .then(() => {
    console.log('Script finalizado.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
