const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '140119',
  database: 'point55',
  port: 5432
});

async function criarPromocoes() {
  try {
    console.log('📢 CRIANDO PROMOÇÕES DE TESTE\n');

    // 1. Buscar produtos por categoria para adicionar às promoções
    console.log('1️⃣ Buscando produtos por categoria...\n');

    const categorias = ['Acessórios', 'Tenis', 'Calcas'];
    const promocoes = [];

    for (const catNome of categorias) {
      const catResult = await pool.query(`
        SELECT id, nome FROM categorias WHERE nome = $1
      `, [catNome]);

      if (catResult.rows.length === 0) {
        console.log(`   ❌ Categoria "${catNome}" não encontrada`);
        continue;
      }

      const cat = catResult.rows[0];
      const prodResult = await pool.query(`
        SELECT p.id
        FROM produtos p
        JOIN produto_categorias pc ON p.id = pc.produto_id
        WHERE pc.categoria_id = $1 AND p.ativo = true AND p.estoque > 0
        ORDER BY RANDOM()
        LIMIT 5
      `, [cat.id]);

      if (prodResult.rows.length === 0) {
        console.log(`   ⚠️  Nenhum produto ativo em "${catNome}"`);
        continue;
      }

      const produtosIds = prodResult.rows.map(p => p.id);
      const desconto = 5 + Math.floor(Math.random() * 20); // 5-25%
      const nomePromo = `Promo ${catNome} ${desconto}%`;

      promocoes.push({
        nome: nomePromo,
        categoria: catNome,
        desconto,
        produtos: produtosIds,
      });

      console.log(`   ✅ ${catNome}: ${produtosIds.length} produtos encontrados`);
    }

    // 2. Inserir as promoções
    console.log('\n2️⃣ Inserindo promoções...\n');

    for (const promo of promocoes) {
      try {
        // Verificar se já existe
        const existe = await pool.query(`
          SELECT id FROM promocoes WHERE nome = $1
        `, [promo.nome]);

        if (existe.rows.length > 0) {
          console.log(`   ⚠️  Promoção "${promo.nome}" já existe (ID: ${existe.rows[0].id})`);
          continue;
        }

        const agora = new Date();
        const dataInicio = new Date(agora.getTime() - 1000 * 60 * 60 * 24); // 1 dia atrás
        const dataFim = new Date(agora.getTime() + 1000 * 60 * 60 * 24 * 7); // 7 dias

        const result = await pool.query(`
          INSERT INTO promocoes (
            nome,
            descricao,
            tipo_desconto,
            desconto_percentual,
            desconto_valor,
            data_inicio,
            data_fim,
            ativa,
            produtos_aplicaveis,
            data_criacao
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `, [
          promo.nome,
          `Promoção especial para ${promo.categoria}: ${promo.desconto}% de desconto!`,
          'percentual',
          promo.desconto, // desconto_percentual
          0, // desconto_valor
          dataInicio,
          dataFim,
          true,
          `{${promo.produtos.join(',')}}`, // Array de IDs
          agora,
        ]);

        console.log(`   ✅ Criada: "${promo.nome}" (ID: ${result.rows[0].id})`);
        console.log(`      Desconto: ${promo.desconto}%`);
        console.log(`      Produtos: ${promo.produtos.length}\n`);

      } catch (error) {
        console.log(`   ❌ Erro ao criar "${promo.nome}": ${error.message}`);
      }
    }

    // 3. Listar todas as promoções criadas
    console.log('\n3️⃣ Promoções ativas:\n');
    const todasPromos = await pool.query(`
      SELECT id, nome, desconto_percentual,
             array_length(produtos_aplicaveis, 1) as qtd_produtos,
             data_inicio, data_fim
      FROM promocoes
      WHERE ativa = true
      ORDER BY data_criacao DESC
    `);

    todasPromos.rows.forEach((promo, idx) => {
      console.log(`   ${idx + 1}. ${promo.nome}`);
      console.log(`      Desconto: ${promo.desconto_percentual}%`);
      console.log(`      Produtos: ${promo.qtd_produtos || 0}`);
    });

    console.log('\n\n✨ Promoções criadas com sucesso!\n');
    await pool.end();

  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
  }
}

criarPromocoes();
