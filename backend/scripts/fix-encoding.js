const { pool } = require('../config/database');

/**
 * Script para corrigir problemas de encoding nos dados do banco
 * Remove caracteres nulos (\0) e corrige encoding UTF-8
 */

async function fixEncoding() {
  console.log('🔧 Iniciando correção de encoding...\n');
  
  try {
    // 1. Buscar produtos com possíveis problemas (sem tentar atualizar com \0 diretamente)
    console.log('1️⃣ Buscando produtos com problemas de encoding...');
    const produtosProblema = await pool.query(`
      SELECT id, nome, descricao, categoria_id
      FROM produtos
      WHERE 
        LENGTH(nome) != OCTET_LENGTH(nome) OR
        LENGTH(COALESCE(descricao, '')) != OCTET_LENGTH(COALESCE(descricao, ''))
      LIMIT 50
    `);
    
    if (produtosProblema.rows.length > 0) {
      console.log(`   ⚠️  Encontrados ${produtosProblema.rows.length} produtos com possíveis problemas:`);
      let count = 0;
      for (const produto of produtosProblema.rows) {
        // Limpar cada produto individualmente
        try {
          // Remover caracteres problemáticos usando expressão regular
          const nomeLimpo = produto.nome
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove caracteres de controle
            .replace(/\\0/g, '') // Remove \0 literal
            .trim();
          
          const descLimpa = (produto.descricao || '')
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            .replace(/\\0/g, '')
            .trim();
          
          if (nomeLimpo !== produto.nome || descLimpa !== produto.descricao) {
            await pool.query(
              'UPDATE produtos SET nome = $1, descricao = $2 WHERE id = $3',
              [nomeLimpo, descLimpa, produto.id]
            );
            count++;
            console.log(`      ✅ ID ${produto.id}: "${nomeLimpo}"`);
          }
        } catch (err) {
          console.log(`      ❌ Erro ao atualizar produto ${produto.id}: ${err.message}`);
        }
      }
      console.log(`   ✅ ${count} produtos corrigidos`);
    } else {
      console.log('   ✅ Nenhum produto com problema de encoding encontrado');
    }

    // 2. Verificar categorias
    console.log('\n2️⃣ Verificando categorias...');
    const categorias = await pool.query('SELECT * FROM categorias ORDER BY id');
    console.log('   Categorias no banco:');
    let categoriasCorrigidas = 0;
    for (const cat of categorias.rows) {
      const nomeLimpo = cat.nome
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
        .replace(/\\0/g, '')
        .trim();
      
      if (nomeLimpo !== cat.nome) {
        await pool.query('UPDATE categorias SET nome = $1 WHERE id = $2', [nomeLimpo, cat.id]);
        console.log(`   ✅ ID ${cat.id}: "${cat.nome}" → "${nomeLimpo}"`);
        categoriasCorrigidas++;
      } else {
        console.log(`   ✅ ID ${cat.id}: "${cat.nome}"`);
      }
    }
    if (categoriasCorrigidas > 0) {
      console.log(`   📝 ${categoriasCorrigidas} categorias corrigidas`);
    }

    // 5. Estatísticas finais
    console.log('\n📊 Estatísticas:');
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_produtos,
        COUNT(CASE WHEN desconto_percentual > 0 THEN 1 END) as produtos_promocao
      FROM produtos
      WHERE ativo = true
    `);
    console.log(`   Total de produtos ativos: ${stats.rows[0].total_produtos}`);
    console.log(`   Produtos em promoção: ${stats.rows[0].produtos_promocao}`);

    console.log('\n✅ Correção de encoding concluída!\n');
  } catch (error) {
    console.error('❌ Erro ao corrigir encoding:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar
fixEncoding().catch(console.error);
