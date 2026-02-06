const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'point55',
  password: '140119',
  port: 5432
});

// Função para determinar a categoria e buscar imagem apropriada
function getImagensParaProduto(nome) {
  const nomeLower = nome.toLowerCase();
  
  // Tênis e calçados
  if (nomeLower.includes('nike') || nomeLower.includes('adidas') || 
      nomeLower.includes('asics') || nomeLower.includes('mizuno') ||
      nomeLower.includes('tenis') || nomeLower.includes('tênis') ||
      nomeLower.includes('jordan') || nomeLower.includes('air') ||
      nomeLower.includes('all star') || nomeLower.includes('converse')) {
    
    if (nomeLower.includes('branco') || nomeLower.includes('white')) {
      return [
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800',
        'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800'
      ];
    } else if (nomeLower.includes('preto') || nomeLower.includes('black')) {
      return [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
        'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800'
      ];
    } else if (nomeLower.includes('jordan')) {
      return [
        'https://images.unsplash.com/photo-1612902376853-5ddca3d01fd0?w=800',
        'https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=800'
      ];
    } else {
      return [
        'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800',
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800'
      ];
    }
  }
  
  // Camisas de time
  if (nomeLower.includes('camisa') && (nomeLower.includes('fluminense') || 
      nomeLower.includes('vasco') || nomeLower.includes('flamengo') ||
      nomeLower.includes('botafogo') || nomeLower.includes('seleção'))) {
    return [
      'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800',
      'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=800'
    ];
  }
  
  // Bermudas
  if (nomeLower.includes('bermuda') || nomeLower.includes('short')) {
    if (nomeLower.includes('preto') || nomeLower.includes('black')) {
      return [
        'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800'
      ];
    } else {
      return [
        'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800',
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800'
      ];
    }
  }
  
  // Calças
  if (nomeLower.includes('calça') || nomeLower.includes('calca') || 
      nomeLower.includes('jeans') || nomeLower.includes('moletom')) {
    return [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
      'https://images.unsplash.com/photo-1624378440070-7b44c0b0b639?w=800'
    ];
  }
  
  // Camisetas/Polos
  if (nomeLower.includes('polo') || nomeLower.includes('camiseta') ||
      nomeLower.includes('camisa') && !nomeLower.includes('time')) {
    if (nomeLower.includes('branco') || nomeLower.includes('white')) {
      return [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'
      ];
    } else if (nomeLower.includes('preto') || nomeLower.includes('black')) {
      return [
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'
      ];
    } else {
      return [
        'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800',
        'https://images.unsplash.com/photo-1622445275576-721325c6c923?w=800'
      ];
    }
  }
  
  // Bonés
  if (nomeLower.includes('boné') || nomeLower.includes('bone') || 
      nomeLower.includes('cap')) {
    return [
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800',
      'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=800'
    ];
  }
  
  // Meias
  if (nomeLower.includes('meia') || nomeLower.includes('sock')) {
    return [
      'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800'
    ];
  }
  
  // Bolsas e acessórios
  if (nomeLower.includes('bolsa') || nomeLower.includes('mochila') ||
      nomeLower.includes('bag')) {
    return [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
      'https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=800'
    ];
  }
  
  // Default - imagem genérica de produto
  return [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
  ];
}

async function adicionarImagens() {
  try {
    // Buscar todos os produtos
    const result = await pool.query(`
      SELECT id, nome, imagens 
      FROM produtos 
      WHERE ativo = true
      ORDER BY id
    `);
    
    console.log(`Encontrados ${result.rows.length} produtos ativos\n`);
    
    let atualizados = 0;
    
    for (const produto of result.rows) {
      // Pular produtos que já têm imagens
      if (produto.imagens && produto.imagens.length > 0) {
        console.log(`[SKIP] ${produto.id} - ${produto.nome.substring(0, 40)} - Já tem imagens`);
        continue;
      }
      
      const imagens = getImagensParaProduto(produto.nome);
      
      await pool.query(
        'UPDATE produtos SET imagens = $1 WHERE id = $2',
        [imagens, produto.id]
      );
      
      atualizados++;
      console.log(`[OK] ${produto.id} - ${produto.nome.substring(0, 50)} - ${imagens.length} imagens`);
    }
    
    console.log(`\n✓ Total de produtos atualizados: ${atualizados}`);
    await pool.end();
    
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
}

adicionarImagens();
