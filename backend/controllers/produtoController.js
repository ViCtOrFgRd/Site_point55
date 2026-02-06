const { pool } = require('../config/database');

// Helper: Aplicar promoções vigentes aos produtos
const aplicarPromocoes = async (produtos) => {
  if (!produtos || produtos.length === 0) return produtos;

  try {
    // Buscar promoções vigentes e ativas
    const promocoesResult = await pool.query(
      `SELECT id, tipo_desconto, desconto_percentual, desconto_valor, produtos_aplicaveis
       FROM promocoes
       WHERE ativa = true 
         AND data_inicio <= NOW()
         AND data_fim >= NOW()`
    );

    const promocoesAtivas = promocoesResult.rows;
    if (promocoesAtivas.length === 0) return produtos;

    // Aplicar promoções a cada produto
    return produtos.map(produto => {
      let melhorDesconto = 0;
      let promocaoAplicada = null;

      for (const promo of promocoesAtivas) {
        // Verificar se promoção se aplica ao produto
        const aplicavel = !promo.produtos_aplicaveis || 
                          promo.produtos_aplicaveis.length === 0 ||
                          promo.produtos_aplicaveis.includes(produto.id);

        if (aplicavel) {
          let desconto = 0;
          
          if (promo.tipo_desconto === 'percentual') {
            desconto = promo.desconto_percentual || 0;
          } else if (promo.tipo_desconto === 'valor_fixo') {
            desconto = ((promo.desconto_valor || 0) / parseFloat(produto.preco)) * 100;
          }

          if (desconto > melhorDesconto) {
            melhorDesconto = desconto;
            promocaoAplicada = promo;
          }
        }
      }

      // Se há desconto de promoção, aplicar
      if (melhorDesconto > 0 && promocaoAplicada) {
        const precoOriginal = parseFloat(produto.preco_original || produto.preco);
        let novoPreco;

        if (promocaoAplicada.tipo_desconto === 'percentual') {
          novoPreco = precoOriginal * (1 - melhorDesconto / 100);
        } else {
          novoPreco = precoOriginal - (promocaoAplicada.desconto_valor || 0);
        }

        // Garantir que o preço não fique negativo
        novoPreco = Math.max(novoPreco, 0.01);

        return {
          ...produto,
          preco_original: precoOriginal,
          preco: novoPreco.toFixed(2),
          desconto_percentual: Math.round(melhorDesconto),
          promocao_aplicada: {
            id: promocaoAplicada.id,
            tipo: promocaoAplicada.tipo_desconto,
            valor: melhorDesconto
          }
        };
      }

      return produto;
    });
  } catch (error) {
    console.error('Erro ao aplicar promoções:', error);
    return produtos; // Retornar produtos sem promoções em caso de erro
  }
};

// GET /api/produtos - Listar produtos com filtros
const listarProdutos = async (req, res) => {
  try {
    const {
      categoria,
      busca,
      precoMin,
      precoMax,
      promocao,
      ordem = 'data_criacao',
      direcao = 'DESC',
      limite = 20,
      pagina = 1,
    } = req.query;

    const offset = (pagina - 1) * limite;
    let query = `
      SELECT DISTINCT p.*,
             ARRAY_AGG(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL) as categoria_ids,
             ARRAY_AGG(DISTINCT c.nome) FILTER (WHERE c.nome IS NOT NULL) as categoria_nomes,
             ARRAY_AGG(DISTINCT c.slug) FILTER (WHERE c.slug IS NOT NULL) as categoria_slugs
      FROM produtos p
      LEFT JOIN produto_categorias pc ON p.id = pc.produto_id
      LEFT JOIN categorias c ON pc.categoria_id = c.id
      WHERE p.ativo = true AND p.estoque > 0 AND p.preco > 0
    `;
    const params = [];
    let paramCount = 1;

    // Filtro por categoria (suporta tanto ID quanto slug, e agora múltiplas categorias)
    if (categoria) {
      const isNumeric = !isNaN(categoria);
      if (isNumeric) {
        query += ` AND EXISTS (SELECT 1 FROM produto_categorias WHERE produto_id = p.id AND categoria_id = $${paramCount})`;
        params.push(categoria);
      } else {
        query += ` AND EXISTS (SELECT 1 FROM produto_categorias pc2 JOIN categorias c2 ON pc2.categoria_id = c2.id WHERE pc2.produto_id = p.id AND c2.slug = $${paramCount})`;
        params.push(categoria);
      }
      paramCount++;
    }

    // Filtro por busca
    if (busca) {
      query += ` AND (p.nome ILIKE $${paramCount} OR p.descricao ILIKE $${paramCount})`;
      params.push(`%${busca}%`);
      paramCount++;
    }

    // Filtro por preço mínimo
    if (precoMin) {
      query += ` AND p.preco >= $${paramCount}`;
      params.push(precoMin);
      paramCount++;
    }

    // Filtro por preço máximo
    if (precoMax) {
      query += ` AND p.preco <= $${paramCount}`;
      params.push(precoMax);
      paramCount++;
    }

    // Filtro por promoção
    if (promocao === 'true') {
      query += ` AND p.desconto_percentual > 0`;
    }

    // Ordenação
    const ordensPermitidas = {
      data_criacao: 'p.data_criacao',
      preco: 'p.preco',
      nome: 'p.nome',
      vendas: 'p.vendas_total',
    };
    const ordenacao = ordensPermitidas[ordem] || 'p.data_criacao';
    const direcaoOrdem = direcao.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` GROUP BY p.id`;
    query += ` ORDER BY ${ordenacao} ${direcaoOrdem}`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limite, offset);

    const result = await pool.query(query, params);

    // Contar total
    let countQuery = `SELECT COUNT(DISTINCT p.id) FROM produtos p 
                      LEFT JOIN produto_categorias pc ON p.id = pc.produto_id
                      LEFT JOIN categorias c ON pc.categoria_id = c.id
                      WHERE p.ativo = true AND p.estoque > 0 AND p.preco > 0`;
    const countParams = [];
    let countParamNum = 1;

    if (categoria) {
      const isNumeric = !isNaN(categoria);
      if (isNumeric) {
        countQuery += ` AND EXISTS (SELECT 1 FROM produto_categorias WHERE produto_id = p.id AND categoria_id = $${countParamNum})`;
        countParams.push(categoria);
      } else {
        countQuery += ` AND EXISTS (SELECT 1 FROM produto_categorias pc2 JOIN categorias c2 ON pc2.categoria_id = c2.id WHERE pc2.produto_id = p.id AND c2.slug = $${countParamNum})`;
        countParams.push(categoria);
      }
      countParamNum++;
    }

    if (busca) {
      countQuery += ` AND (p.nome ILIKE $${countParamNum} OR p.descricao ILIKE $${countParamNum})`;
      countParams.push(`%${busca}%`);
      countParamNum++;
    }

    if (precoMin) {
      countQuery += ` AND p.preco >= $${countParamNum}`;
      countParams.push(precoMin);
      countParamNum++;
    }

    if (precoMax) {
      countQuery += ` AND p.preco <= $${countParamNum}`;
      countParams.push(precoMax);
      countParamNum++;
    }

    if (promocao === 'true') {
      countQuery += ` AND p.desconto_percentual > 0`;
    }

    const countResult = await pool.query(countQuery, countParams);

    // Aplicar promoções vigentes aos produtos
    const produtosComPromocao = await aplicarPromocoes(result.rows);

    res.json({
      success: true,
      count: produtosComPromocao.length,
      total: parseInt(countResult.rows[0].count),
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(countResult.rows[0].count / limite),
      data: produtosComPromocao,
    });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar produtos',
    });
  }
};

// GET /api/produtos/:id - Obter produto específico
const obterProduto = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*,
              ARRAY_AGG(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL) as categoria_ids,
              ARRAY_AGG(DISTINCT c.nome) FILTER (WHERE c.nome IS NOT NULL) as categoria_nomes,
              ARRAY_AGG(DISTINCT c.slug) FILTER (WHERE c.slug IS NOT NULL) as categoria_slugs
       FROM produtos p
       LEFT JOIN produto_categorias pc ON p.id = pc.produto_id
       LEFT JOIN categorias c ON pc.categoria_id = c.id
       WHERE p.id = $1
       GROUP BY p.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
      });
    }

    // Buscar média de avaliações
    const avaliacoesResult = await pool.query(
      `SELECT 
        AVG(nota) as media_avaliacoes,
        COUNT(*) as total_avaliacoes
       FROM avaliacoes
       WHERE produto_id = $1 AND ativo = true`,
      [id]
    );

    // Buscar badges do produto
    const badgesResult = await pool.query(
      `SELECT b.*
       FROM badges b
       INNER JOIN produtos_badges pb ON b.id = pb.badge_id
       WHERE pb.produto_id = $1`,
      [id]
    );

    let produto = {
      ...result.rows[0],
      media_avaliacoes: parseFloat(avaliacoesResult.rows[0].media_avaliacoes) || 0,
      total_avaliacoes: parseInt(avaliacoesResult.rows[0].total_avaliacoes) || 0,
      badges: badgesResult.rows,
    };

    // Aplicar promoções vigentes ao produto
    const produtosComPromocao = await aplicarPromocoes([produto]);
    produto = produtosComPromocao[0];

    res.json({
      success: true,
      data: produto,
    });
  } catch (error) {
    console.error('Erro ao obter produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar produto',
    });
  }
};

// GET /api/produtos/promocoes - Listar produtos em promoção
const listarPromocoes = async (req, res) => {
  try {
    const { categoria, limite = 20, pagina = 1 } = req.query;
    const offset = (pagina - 1) * limite;

    // Buscar produtos com desconto direto OU que possuem promoção vigente
    let query = `SELECT DISTINCT p.*,
         ARRAY_AGG(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL) as categoria_ids,
         ARRAY_AGG(DISTINCT c.nome) FILTER (WHERE c.nome IS NOT NULL) as categoria_nomes,
         ARRAY_AGG(DISTINCT c.slug) FILTER (WHERE c.slug IS NOT NULL) as categoria_slugs
       FROM produtos p
       LEFT JOIN produto_categorias pc ON p.id = pc.produto_id
       LEFT JOIN categorias c ON pc.categoria_id = c.id
       WHERE p.ativo = true AND p.estoque > 0 AND (
         p.desconto_percentual > 0 
         OR EXISTS (
           SELECT 1 FROM promocoes 
           WHERE ativa = true
           AND data_inicio <= NOW()
           AND data_fim >= NOW()
           AND (
             produtos_aplicaveis IS NULL 
             OR produtos_aplicaveis = '{}' 
             OR p.id = ANY(produtos_aplicaveis)
           )
         )
       )`;

    const params = [];
    let paramCount = 1;

    // Filtro por categoria (suporta tanto ID quanto slug)
    if (categoria) {
      const isNumeric = !isNaN(categoria);
      if (isNumeric) {
        query += ` AND EXISTS (SELECT 1 FROM produto_categorias WHERE produto_id = p.id AND categoria_id = $${paramCount})`;
        params.push(categoria);
      } else {
        query += ` AND EXISTS (SELECT 1 FROM produto_categorias pc2 JOIN categorias c2 ON pc2.categoria_id = c2.id WHERE pc2.produto_id = p.id AND c2.slug = $${paramCount})`;
        params.push(categoria);
      }
      paramCount++;
    }

    query += ` GROUP BY p.id ORDER BY p.desconto_percentual DESC, p.data_criacao DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limite, offset);

    const result = await pool.query(query, params);

    // Contar total com os mesmos filtros
    let countQuery = `SELECT COUNT(DISTINCT p.id) FROM produtos p
       LEFT JOIN produto_categorias pc ON p.id = pc.produto_id
       LEFT JOIN categorias c ON pc.categoria_id = c.id
       WHERE p.ativo = true AND p.estoque > 0 AND (
         p.desconto_percentual > 0 
         OR EXISTS (
           SELECT 1 FROM promocoes 
           WHERE ativa = true
           AND data_inicio <= NOW()
           AND data_fim >= NOW()
           AND (
             produtos_aplicaveis IS NULL 
             OR produtos_aplicaveis = '{}' 
             OR p.id = ANY(produtos_aplicaveis)
           )
         )
       )`;

    const countParams = [];
    let countParamNum = 1;

    if (categoria) {
      const isNumeric = !isNaN(categoria);
      if (isNumeric) {
        countQuery += ` AND EXISTS (SELECT 1 FROM produto_categorias WHERE produto_id = p.id AND categoria_id = $${countParamNum})`;
        countParams.push(categoria);
      } else {
        countQuery += ` AND EXISTS (SELECT 1 FROM produto_categorias pc2 JOIN categorias c2 ON pc2.categoria_id = c2.id WHERE pc2.produto_id = p.id AND c2.slug = $${countParamNum})`;
        countParams.push(categoria);
      }
      countParamNum++;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      count: result.rows.length,
      total: parseInt(countResult.rows[0].count),
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(countResult.rows[0].count / limite),
      data: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar promoções:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar promoções',
      message: error.message,
    });
  }
};

// GET /api/produtos/destaques - Listar produtos em destaque
const listarDestaques = async (req, res) => {
  try {
    const { limite = 8 } = req.query;

    const result = await pool.query(
      `SELECT p.*, c.nome as categoria_nome, c.slug as categoria_slug
       FROM produtos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.ativo = true AND p.estoque > 0
       ORDER BY p.vendas_total DESC, p.data_criacao DESC
       LIMIT $1`,
      [limite]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar destaques:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar produtos em destaque',
    });
  }
};

// POST /api/produtos - Criar novo produto (admin)
const criarProduto = async (req, res) => {
  try {
    let {
      nome,
      descricao,
      preco,
      preco_original,
      desconto_percentual,
      categoria_id,
      categoria_ids, // Suporta múltiplas categorias
      estoque,
      imagens,
      cores_disponiveis,
      tamanhos_disponiveis,
      ativo = true,
    } = req.body;

    // Validação básica
    if (!nome || !preco) {
      return res.status(400).json({
        success: false,
        error: 'Nome e preço são obrigatórios',
      });
    }

    // Validar que tem pelo menos uma categoria
    const categoriasParaAdicionar = categoria_ids || (categoria_id ? [categoria_id] : null);
    if (!categoriasParaAdicionar || categoriasParaAdicionar.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Pelo menos uma categoria é obrigatória',
      });
    }

    // Conversão de tipos com validação robusta
    preco = parseFloat(String(preco).trim());
    if (isNaN(preco)) preco = 0;
    
    preco_original = preco_original ? parseFloat(String(preco_original).trim()) : null;
    if (preco_original && isNaN(preco_original)) preco_original = null;
    
    desconto_percentual = Math.round(parseFloat(String(desconto_percentual || 0).trim()));
    if (isNaN(desconto_percentual)) desconto_percentual = 0;
    
    estoque = parseInt(String(estoque || 0).trim());
    if (isNaN(estoque)) estoque = 0;
    
    ativo = ativo === true || ativo === 'true' || ativo === 1;
    
    // Garantir arrays válidos
    imagens = Array.isArray(imagens) ? imagens : [];
    cores_disponiveis = Array.isArray(cores_disponiveis) ? cores_disponiveis : [];
    tamanhos_disponiveis = Array.isArray(tamanhos_disponiveis) ? tamanhos_disponiveis : [];

    // Criar produto mantendo categoria_id para compatibilidade
    const primeiraCategoria = parseInt(categoriasParaAdicionar[0]);
    
    const result = await pool.query(
      `INSERT INTO produtos 
       (nome, descricao, preco, preco_original, desconto_percentual, categoria_id, 
        estoque, imagens, cores_disponiveis, tamanhos_disponiveis, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        nome,
        descricao,
        preco,
        preco_original,
        desconto_percentual,
        primeiraCategoria,
        estoque,
        imagens,
        cores_disponiveis,
        tamanhos_disponiveis,
        ativo,
      ]
    );

    const produtoId = result.rows[0].id;

    // Adicionar todas as categorias à tabela produto_categorias
    if (categoriasParaAdicionar && categoriasParaAdicionar.length > 0) {
      for (const catId of categoriasParaAdicionar) {
        await pool.query(
          `INSERT INTO produto_categorias (produto_id, categoria_id)
           VALUES ($1, $2)
           ON CONFLICT (produto_id, categoria_id) DO NOTHING`,
          [produtoId, parseInt(catId)]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Produto criado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('❌ Erro ao criar produto:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar produto',
    });
  }
};

// PUT /api/produtos/:id - Atualizar produto (admin)
const atualizarProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const campos = req.body;
    let categoriasParaAdicionar = null;

    // Verificar se produto existe
    const produtoExiste = await pool.query(
      'SELECT id FROM produtos WHERE id = $1',
      [id]
    );

    if (produtoExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
      });
    }

    // Verificar se está tentando atualizar categorias
    if (campos.categoria_ids) {
      categoriasParaAdicionar = campos.categoria_ids;
      delete campos.categoria_ids; // Remover do objeto de atualizações
    }

    // Construir query dinâmica
    const camposPermitidos = [
      'nome',
      'descricao',
      'preco',
      'preco_original',
      'desconto_percentual',
      'categoria_id',
      'estoque',
      'imagens',
      'cores_disponiveis',
      'tamanhos_disponiveis',
      'ativo',
    ];

    const updates = [];
    const valores = [];
    let paramCount = 1;

    for (const campo of Object.keys(campos)) {
      if (!camposPermitidos.includes(campo)) {
        continue; // Pular campos não permitidos
      }

      let valor = campos[campo];
      
      // Pular valores undefined
      if (valor === undefined) {
        continue;
      }

      // Conversão especial para campos numéricos
      if (['preco', 'preco_original', 'desconto_percentual', 'estoque', 'categoria_id'].includes(campo)) {
        if (valor === '' || valor === null) {
          // Para preco_original, permitir NULL
          if (campo === 'preco_original') {
            valor = null;
          } else if (campo === 'desconto_percentual' || campo === 'estoque') {
            valor = 0;
          } else {
            // Campos obrigatórios não podem ser vazios
            continue;
          }
        } else {
          // Converter para string antes de fazer parseFloat para evitar problemas
          const strValue = String(valor).trim();
          let numValue = parseFloat(strValue);
          
          if (isNaN(numValue)) {
            console.warn(`⚠️ Valor inválido para campo ${campo}: "${valor}"`);
            if (campo === 'desconto_percentual' || campo === 'estoque') {
              valor = 0;
            } else {
              // Ignorar valores que não são números válidos
              continue;
            }
          } else {
            // Para desconto_percentual, converter para inteiro
            if (campo === 'desconto_percentual') {
              valor = Math.round(numValue);
            } else {
              valor = numValue;
            }
          }
        }
      }
      
      // Conversão para boolean
      if (campo === 'ativo') {
        valor = valor === true || valor === 'true' || valor === 1 || valor === '1';
      }
      
      // Certificar que arrays estão no formato correto
      if (['imagens', 'cores_disponiveis', 'tamanhos_disponiveis'].includes(campo)) {
        if (!Array.isArray(valor)) {
          if (typeof valor === 'string') {
            valor = valor.trim() ? [valor] : [];
          } else {
            valor = [];
          }
        }
      }
      
      updates.push(`${campo} = $${paramCount}`);
      valores.push(valor);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum campo válido para atualizar',
      });
    }

    valores.push(id);
    const query = `
      UPDATE produtos
      SET ${updates.join(', ')}, data_atualizacao = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    console.log('🔧 Query:', query);
    console.log('📊 Valores:', valores);

    const result = await pool.query(query, valores);

    // Atualizar categorias se fornecidas
    if (categoriasParaAdicionar && Array.isArray(categoriasParaAdicionar)) {
      // Remover categorias antigas
      await pool.query(
        `DELETE FROM produto_categorias WHERE produto_id = $1`,
        [id]
      );

      // Adicionar novas categorias
      for (const catId of categoriasParaAdicionar) {
        await pool.query(
          `INSERT INTO produto_categorias (produto_id, categoria_id)
           VALUES ($1, $2)
           ON CONFLICT (produto_id, categoria_id) DO NOTHING`,
          [id, parseInt(catId)]
        );
      }
    }

    res.json({
      success: true,
      message: 'Produto atualizado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar produto:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar produto',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// PATCH /api/produtos/:id/estoque - Atualizar estoque (admin)
const atualizarEstoque = async (req, res) => {
  try {
    const { id } = req.params;
    const { estoque, quantidade } = req.body;
    const novoEstoque = estoque !== undefined ? estoque : quantidade;

    if (novoEstoque === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Estoque ou quantidade é obrigatória',
      });
    }

    const result = await pool.query(
      `UPDATE produtos
       SET estoque = $1, data_atualizacao = NOW()
       WHERE id = $2
       RETURNING id, nome, estoque`,
      [novoEstoque, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Estoque atualizado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar estoque',
    });
  }
};

// DELETE /api/produtos/:id - Deletar produto (admin)
const deletarProduto = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se produto existe
    const produtoExiste = await pool.query(
      'SELECT id FROM produtos WHERE id = $1',
      [id]
    );

    if (produtoExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
      });
    }

    // Soft delete - apenas desativar
    await pool.query(
      'UPDATE produtos SET ativo = false WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Produto desativado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar produto',
    });
  }
};

module.exports = {
  listarProdutos,
  obterProduto,
  listarPromocoes,
  listarDestaques,
  criarProduto,
  atualizarProduto,
  atualizarEstoque,
  deletarProduto,
};
