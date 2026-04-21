const { pool } = require('../config/database');
const { aplicarPromocoes } = require('../utils/promocoes');
const { notifyAdmins } = require('../services/notificationService');
const {
  normalizeSizeKey,
  normalizeColorKey,
  normalizeVariantKey,
  parseSizeMap,
  parseColorMap,
  parseVariantStockMap,
} = require('../services/inventoryService');

const isMissingProdutoCategoriasTableError = (error) => (
  error?.code === '42P01' && String(error?.message || '').includes('produto_categorias')
);

let hasProdutoCategoriasTableCache;

const hasProdutoCategoriasTable = async () => {
  if (typeof hasProdutoCategoriasTableCache === 'boolean') {
    return hasProdutoCategoriasTableCache;
  }

  const result = await pool.query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = 'produto_categorias'
     ) AS exists`
  );

  hasProdutoCategoriasTableCache = Boolean(result.rows[0]?.exists);
  return hasProdutoCategoriasTableCache;
};

const getCategoriaQueryConfig = async () => {
  const useJoinTable = await hasProdutoCategoriasTable();

  if (useJoinTable) {
    return {
      select: `ARRAY_AGG(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL) as categoria_ids,
             ARRAY_AGG(DISTINCT c.nome) FILTER (WHERE c.nome IS NOT NULL) as categoria_nomes,
             ARRAY_AGG(DISTINCT c.slug) FILTER (WHERE c.slug IS NOT NULL) as categoria_slugs`,
      joins: `LEFT JOIN produto_categorias pc ON p.id = pc.produto_id
      LEFT JOIN categorias c ON pc.categoria_id = c.id`,
      numericFilter: (param) => `EXISTS (SELECT 1 FROM produto_categorias WHERE produto_id = p.id AND categoria_id = $${param})`,
      slugFilter: (param) => `EXISTS (SELECT 1 FROM produto_categorias pc2 JOIN categorias c2 ON pc2.categoria_id = c2.id WHERE pc2.produto_id = p.id AND c2.slug = $${param})`,
      requiresGroupBy: true,
    };
  }

  return {
    select: `ARRAY_REMOVE(ARRAY[p.categoria_id], NULL) as categoria_ids,
             ARRAY_REMOVE(ARRAY[c.nome], NULL) as categoria_nomes,
             ARRAY_REMOVE(ARRAY[c.slug], NULL) as categoria_slugs`,
    joins: `LEFT JOIN categorias c ON p.categoria_id = c.id`,
    numericFilter: (param) => `p.categoria_id = $${param}`,
    slugFilter: (param) => `c.slug = $${param}`,
    requiresGroupBy: false,
  };
};

// GET /api/produtos/admin - Listar produtos (admin, sem filtros de visibilidade)
const listarProdutosAdmin = async (req, res) => {
  try {
    const {
      categoria,
      busca,
      precoMin,
      precoMax,
      promocao,
      ordem = 'data_criacao',
      direcao = 'DESC',
      limite = 1000,
      pagina = 1,
    } = req.query;
    const categoriaQuery = await getCategoriaQueryConfig();

    const offset = (pagina - 1) * limite;
    let query = `
      SELECT DISTINCT p.*,
             ${categoriaQuery.select}
      FROM produtos p
      ${categoriaQuery.joins}
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (categoria) {
      const isNumeric = !isNaN(categoria);
      if (isNumeric) {
        query += ` AND ${categoriaQuery.numericFilter(paramCount)}`;
        params.push(categoria);
      } else {
        query += ` AND ${categoriaQuery.slugFilter(paramCount)}`;
        params.push(categoria);
      }
      paramCount++;
    }

    if (busca) {
      query += ` AND (p.nome ILIKE $${paramCount} OR p.descricao ILIKE $${paramCount})`;
      params.push(`%${busca}%`);
      paramCount++;
    }

    if (precoMin) {
      query += ` AND p.preco >= $${paramCount}`;
      params.push(precoMin);
      paramCount++;
    }

    if (precoMax) {
      query += ` AND p.preco <= $${paramCount}`;
      params.push(precoMax);
      paramCount++;
    }

    if (promocao === 'true') {
      query += ` AND (
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
    }

    const ordensPermitidas = {
      data_criacao: 'p.data_criacao',
      preco: 'p.preco',
      nome: 'p.nome',
      vendas: 'p.vendas_total',
    };
    const ordenacao = ordensPermitidas[ordem] || 'p.data_criacao';
    const direcaoOrdem = direcao.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    if (categoriaQuery.requiresGroupBy) {
      query += ` GROUP BY p.id`;
    }
    query += ` ORDER BY ${ordenacao} ${direcaoOrdem}`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limite, offset);

    const result = await pool.query(query, params);

    let countQuery = `SELECT COUNT(DISTINCT p.id) FROM produtos p
              ${categoriaQuery.joins}
                      WHERE 1=1`;
    const countParams = [];
    let countParamNum = 1;

    if (categoria) {
      const isNumeric = !isNaN(categoria);
      if (isNumeric) {
        countQuery += ` AND ${categoriaQuery.numericFilter(countParamNum)}`;
        countParams.push(categoria);
      } else {
        countQuery += ` AND ${categoriaQuery.slugFilter(countParamNum)}`;
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
      countQuery += ` AND (
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
    }

    const countResult = await pool.query(countQuery, countParams);
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
    console.error('Erro ao listar produtos (admin):', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar produtos',
    });
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
    const categoriaQuery = await getCategoriaQueryConfig();

    const offset = (pagina - 1) * limite;
    let query = `
      SELECT DISTINCT p.*,
             ${categoriaQuery.select}
      FROM produtos p
      ${categoriaQuery.joins}
      WHERE p.ativo = true AND p.estoque > 0 AND p.preco > 0
    `;
    const params = [];
    let paramCount = 1;

    // Filtro por categoria (suporta tanto ID quanto slug, e agora múltiplas categorias)
    if (categoria) {
      const isNumeric = !isNaN(categoria);
      if (isNumeric) {
        query += ` AND ${categoriaQuery.numericFilter(paramCount)}`;
        params.push(categoria);
      } else {
        query += ` AND ${categoriaQuery.slugFilter(paramCount)}`;
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
      query += ` AND (
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

    if (categoriaQuery.requiresGroupBy) {
      query += ` GROUP BY p.id`;
    }
    query += ` ORDER BY ${ordenacao} ${direcaoOrdem}`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limite, offset);

    const result = await pool.query(query, params);

    // Contar total
    let countQuery = `SELECT COUNT(DISTINCT p.id) FROM produtos p 
              ${categoriaQuery.joins}
                      WHERE p.ativo = true AND p.estoque > 0 AND p.preco > 0`;
    const countParams = [];
    let countParamNum = 1;

    if (categoria) {
      const isNumeric = !isNaN(categoria);
      if (isNumeric) {
        countQuery += ` AND ${categoriaQuery.numericFilter(countParamNum)}`;
        countParams.push(categoria);
      } else {
        countQuery += ` AND ${categoriaQuery.slugFilter(countParamNum)}`;
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
      countQuery += ` AND (
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
    const categoriaQuery = await getCategoriaQueryConfig();

    if (!/^\d+$/.test(String(id))) {
      return res.status(400).json({
        success: false,
        error: 'ID do produto invalido',
      });
    }

    const result = await pool.query(
      `SELECT p.*,
              ${categoriaQuery.select}
       FROM produtos p
       ${categoriaQuery.joins}
       WHERE p.id = $1
       ${categoriaQuery.requiresGroupBy ? 'GROUP BY p.id' : ''}`,
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
    const categoriaQuery = await getCategoriaQueryConfig();
    const offset = (pagina - 1) * limite;

    // Buscar produtos com desconto direto OU que possuem promoção vigente
    let query = `SELECT DISTINCT p.*,
         ${categoriaQuery.select}
       FROM produtos p
       ${categoriaQuery.joins}
       WHERE p.ativo = true AND p.estoque > 0 AND p.preco > 0 AND (
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
        query += ` AND ${categoriaQuery.numericFilter(paramCount)}`;
        params.push(categoria);
      } else {
        query += ` AND ${categoriaQuery.slugFilter(paramCount)}`;
        params.push(categoria);
      }
      paramCount++;
    }

    if (categoriaQuery.requiresGroupBy) {
      query += ` GROUP BY p.id`;
    }
    query += ` ORDER BY p.desconto_percentual DESC, p.data_criacao DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limite, offset);

    const result = await pool.query(query, params);

    // Contar total com os mesmos filtros
     let countQuery = `SELECT COUNT(DISTINCT p.id) FROM produtos p
       ${categoriaQuery.joins}
       WHERE p.ativo = true AND p.estoque > 0 AND p.preco > 0 AND (
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
        countQuery += ` AND ${categoriaQuery.numericFilter(countParamNum)}`;
        countParams.push(categoria);
      } else {
        countQuery += ` AND ${categoriaQuery.slugFilter(countParamNum)}`;
        countParams.push(categoria);
      }
      countParamNum++;
    }

    const countResult = await pool.query(countQuery, countParams);

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
    const categoriaQuery = await getCategoriaQueryConfig();

    const result = await pool.query(
      `SELECT p.*, 
              ${categoriaQuery.select}
       FROM produtos p
       ${categoriaQuery.joins}
       WHERE p.ativo = true AND p.estoque > 0 AND p.preco > 0
       ${categoriaQuery.requiresGroupBy ? 'GROUP BY p.id' : ''}
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
      preco_pix,
      preco_debito,
      preco_credito,
      preco_boleto,
      preco_original,
      parcelas_maximas,
      desconto_percentual,
      categoria_id,
      categoria_ids, // Suporta múltiplas categorias
      estoque,
      imagens,
      cores_disponiveis,
      tamanhos_disponiveis,
      estoque_variantes,
      estoque_cores,
      estoque_tamanhos,
      tipo_produto_id,
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

    preco_pix = preco_pix !== undefined && preco_pix !== null ? parseFloat(String(preco_pix).trim()) : preco;
    if (isNaN(preco_pix)) preco_pix = preco;

    preco_debito = preco_debito !== undefined && preco_debito !== null ? parseFloat(String(preco_debito).trim()) : preco;
    if (isNaN(preco_debito)) preco_debito = preco;

    preco_credito = preco_credito !== undefined && preco_credito !== null ? parseFloat(String(preco_credito).trim()) : preco;
    if (isNaN(preco_credito)) preco_credito = preco;

    preco_boleto = preco_boleto !== undefined && preco_boleto !== null ? parseFloat(String(preco_boleto).trim()) : preco;
    if (isNaN(preco_boleto)) preco_boleto = preco;

    parcelas_maximas = parcelas_maximas !== undefined && parcelas_maximas !== null
      ? parseInt(String(parcelas_maximas).trim(), 10)
      : 3;
    if (isNaN(parcelas_maximas) || parcelas_maximas <= 0) parcelas_maximas = 3;
    
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

    const tamanhosNormalizados = tamanhos_disponiveis
      .map((tamanho) => normalizeSizeKey(tamanho))
      .filter(Boolean);
    const coresNormalizadas = cores_disponiveis
      .map((cor) => normalizeColorKey(cor))
      .filter(Boolean);

    const estoqueMapBruto = parseSizeMap(estoque_tamanhos);
    const estoqueMapFiltrado = Object.entries(estoqueMapBruto).reduce((acc, [size, qty]) => {
      if (tamanhosNormalizados.length === 0 || tamanhosNormalizados.includes(size)) {
        acc[size] = qty;
      }
      return acc;
    }, {});

    const estoqueCoresMapBruto = parseColorMap(estoque_cores);
    const estoqueCoresMapFiltrado = Object.entries(estoqueCoresMapBruto).reduce((acc, [color, qty]) => {
      if (coresNormalizadas.length === 0 || coresNormalizadas.includes(color)) {
        acc[color] = qty;
      }
      return acc;
    }, {});

    const estoqueVariantesMapBruto = parseVariantStockMap(estoque_variantes);
    const estoqueVariantesFiltrado = Object.entries(estoqueVariantesMapBruto).reduce((acc, [key, qty]) => {
      const [sizeKey = '', colorKey = ''] = String(key).split('|');
      const sizeValida = tamanhosNormalizados.length === 0 || tamanhosNormalizados.includes(sizeKey);
      const corValida = coresNormalizadas.length === 0 || coresNormalizadas.includes(colorKey);
      if (sizeValida && corValida) {
        acc[normalizeVariantKey(sizeKey, colorKey)] = qty;
      }
      return acc;
    }, {});

    let estoqueTamanhosSincronizado = estoqueMapFiltrado;
    let estoqueCoresSincronizado = estoqueCoresMapFiltrado;
    let estoqueVariantesSincronizado = estoqueVariantesFiltrado;

    if (tamanhosNormalizados.length > 0 && coresNormalizadas.length > 0) {
      estoqueTamanhosSincronizado = {};
      estoqueCoresSincronizado = {};
      estoqueVariantesSincronizado = tamanhosNormalizados.reduce((acc, sizeKey) => {
        coresNormalizadas.forEach((colorKey) => {
          const variantKey = normalizeVariantKey(sizeKey, colorKey);
          acc[variantKey] = Number(estoqueVariantesFiltrado[variantKey] || 0);
        });
        return acc;
      }, {});
      estoque = Object.values(estoqueVariantesSincronizado).reduce((acc, qty) => acc + qty, 0);
    } else if (tamanhosNormalizados.length > 0) {
      estoqueTamanhosSincronizado = tamanhosNormalizados.reduce((acc, sizeKey) => {
        acc[sizeKey] = Number(estoqueMapFiltrado[sizeKey] || 0);
        return acc;
      }, {});
      estoqueCoresSincronizado = {};
      estoqueVariantesSincronizado = {};
      estoque = Object.values(estoqueTamanhosSincronizado).reduce((acc, qty) => acc + qty, 0);
    } else if (coresNormalizadas.length > 0) {
      estoqueCoresSincronizado = coresNormalizadas.reduce((acc, colorKey) => {
        acc[colorKey] = Number(estoqueCoresMapFiltrado[colorKey] || 0);
        return acc;
      }, {});
      estoqueTamanhosSincronizado = {};
      estoqueVariantesSincronizado = {};
      estoque = Object.values(estoqueCoresSincronizado).reduce((acc, qty) => acc + qty, 0);
    }

    // Validar e converter tipo_produto_id
    tipo_produto_id = tipo_produto_id ? parseInt(String(tipo_produto_id).trim()) : null;
    if (tipo_produto_id !== null && isNaN(tipo_produto_id)) tipo_produto_id = null;

    // Criar produto mantendo categoria_id para compatibilidade
    const primeiraCategoria = parseInt(categoriasParaAdicionar[0]);
    
    const result = await pool.query(
      `INSERT INTO produtos 
       (nome, descricao, preco, preco_pix, preco_debito, preco_credito, preco_boleto,
        preco_original, parcelas_maximas, desconto_percentual, categoria_id, estoque,
        imagens, cores_disponiveis, tamanhos_disponiveis, estoque_cores, estoque_tamanhos, estoque_variantes, vendidos_tamanhos, tipo_produto_id, ativo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       RETURNING *`,
      [
        nome,
        descricao,
        preco,
        preco_pix,
        preco_debito,
        preco_credito,
        preco_boleto,
        preco_original,
        parcelas_maximas,
        desconto_percentual,
        primeiraCategoria,
        estoque,
        imagens,
        cores_disponiveis,
        tamanhos_disponiveis,
        JSON.stringify(estoqueCoresSincronizado),
        JSON.stringify(estoqueTamanhosSincronizado),
        JSON.stringify(estoqueVariantesSincronizado),
        JSON.stringify({}),
        tipo_produto_id,
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
      'preco_pix',
      'preco_debito',
      'preco_credito',
      'preco_boleto',
      'preco_original',
      'parcelas_maximas',
      'desconto_percentual',
      'categoria_id',
      'estoque',
      'imagens',
      'cores_disponiveis',
      'tamanhos_disponiveis',
      'estoque_cores',
      'estoque_tamanhos',
      'estoque_variantes',
      'vendidos_tamanhos',
      'tipo_produto_id',
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
      if (['preco', 'preco_pix', 'preco_debito', 'preco_credito', 'preco_boleto', 'preco_original', 'parcelas_maximas', 'desconto_percentual', 'estoque', 'categoria_id', 'tipo_produto_id'].includes(campo)) {
        if (valor === '' || valor === null) {
          // Para preco_original e tipo_produto_id, permitir NULL
          if (campo === 'preco_original' || campo === 'tipo_produto_id') {
            valor = null;
          } else if (campo === 'parcelas_maximas') {
            valor = 3;
          } else if (campo === 'desconto_percentual' || campo === 'estoque') {
            valor = 0;
          } else {
            // Campos obrigatórios não podem ser vazios
            continue;
          }
        } else {
          // Converter para string antes de fazer parseFloat para evitar problemas
          const strValue = String(valor).trim();
          let numValue = campo === 'parcelas_maximas'
            ? parseInt(strValue, 10)
            : parseFloat(strValue);
          
          if (isNaN(numValue)) {
            console.warn(`⚠️ Valor inválido para campo ${campo}: "${valor}"`);
            if (campo === 'parcelas_maximas') {
              valor = 3;
            } else if (campo === 'desconto_percentual' || campo === 'estoque') {
              valor = 0;
            } else {
              // Ignorar valores que não são números válidos
              continue;
            }
          } else {
            // Para desconto_percentual, converter para inteiro
            if (campo === 'desconto_percentual') {
              valor = Math.round(numValue);
            } else if (campo === 'parcelas_maximas') {
              valor = numValue <= 0 ? 3 : numValue;
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

      if (campo === 'estoque_tamanhos' || campo === 'vendidos_tamanhos') {
        valor = parseSizeMap(valor);
      }

      if (campo === 'estoque_cores') {
        valor = parseColorMap(valor);
      }

      if (campo === 'estoque_variantes') {
        valor = parseVariantStockMap(valor);
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

    console.info('🔧 Query:', query);
    console.info('📊 Valores:', valores);

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

    const produtoAtualizado = result.rows[0];
    const estoqueTamanhosMap = parseSizeMap(produtoAtualizado.estoque_tamanhos);
    const estoqueCoresMap = parseColorMap(produtoAtualizado.estoque_cores);
    const estoqueVariantesMap = parseVariantStockMap(produtoAtualizado.estoque_variantes);
    const tamanhosDisponiveis = Array.isArray(produtoAtualizado.tamanhos_disponiveis)
      ? produtoAtualizado.tamanhos_disponiveis.map((size) => normalizeSizeKey(size)).filter(Boolean)
      : [];
    const coresDisponiveis = Array.isArray(produtoAtualizado.cores_disponiveis)
      ? produtoAtualizado.cores_disponiveis.map((cor) => normalizeColorKey(cor)).filter(Boolean)
      : [];

    let estoqueSincronizado = produtoAtualizado.estoque;
    let estoqueTamanhosSincronizado = estoqueTamanhosMap;
    let estoqueCoresSincronizado = estoqueCoresMap;
    let estoqueVariantesSincronizado = estoqueVariantesMap;

    if (Object.keys(estoqueTamanhosMap).length > 0 || tamanhosDisponiveis.length > 0 || Object.keys(estoqueCoresMap).length > 0 || coresDisponiveis.length > 0 || Object.keys(estoqueVariantesMap).length > 0) {
      if (tamanhosDisponiveis.length > 0 && coresDisponiveis.length > 0) {
        estoqueTamanhosSincronizado = {};
        estoqueCoresSincronizado = {};
        estoqueVariantesSincronizado = tamanhosDisponiveis.reduce((acc, sizeKey) => {
          coresDisponiveis.forEach((colorKey) => {
            const variantKey = normalizeVariantKey(sizeKey, colorKey);
            acc[variantKey] = Number(estoqueVariantesMap[variantKey] || 0);
          });
          return acc;
        }, {});
        estoqueSincronizado = Object.values(estoqueVariantesSincronizado).reduce((acc, qty) => acc + qty, 0);
      } else if (tamanhosDisponiveis.length > 0) {
        estoqueTamanhosSincronizado = tamanhosDisponiveis.reduce((acc, sizeKey) => {
          acc[sizeKey] = Number(estoqueTamanhosMap[sizeKey] || 0);
          return acc;
        }, {});
        estoqueCoresSincronizado = {};
        estoqueVariantesSincronizado = {};
        estoqueSincronizado = Object.values(estoqueTamanhosSincronizado).reduce((acc, qty) => acc + qty, 0);
      } else if (coresDisponiveis.length > 0) {
        estoqueCoresSincronizado = coresDisponiveis.reduce((acc, colorKey) => {
          acc[colorKey] = Number(estoqueCoresMap[colorKey] || 0);
          return acc;
        }, {});
        estoqueTamanhosSincronizado = {};
        estoqueVariantesSincronizado = {};
        estoqueSincronizado = Object.values(estoqueCoresSincronizado).reduce((acc, qty) => acc + qty, 0);
      } else {
        estoqueTamanhosSincronizado = Object.entries(estoqueTamanhosMap).reduce((acc, [size, qty]) => {
          acc[size] = qty;
          return acc;
        }, {});
        estoqueCoresSincronizado = Object.entries(estoqueCoresMap).reduce((acc, [color, qty]) => {
          acc[color] = qty;
          return acc;
        }, {});
        estoqueVariantesSincronizado = Object.entries(estoqueVariantesMap).reduce((acc, [key, qty]) => {
          acc[key] = qty;
          return acc;
        }, {});
        if (Object.keys(estoqueVariantesSincronizado).length > 0) {
          estoqueSincronizado = Object.values(estoqueVariantesSincronizado).reduce((acc, qty) => acc + qty, 0);
        } else if (Object.keys(estoqueTamanhosSincronizado).length > 0) {
          estoqueSincronizado = Object.values(estoqueTamanhosSincronizado).reduce((acc, qty) => acc + qty, 0);
        } else if (Object.keys(estoqueCoresSincronizado).length > 0) {
          estoqueSincronizado = Object.values(estoqueCoresSincronizado).reduce((acc, qty) => acc + qty, 0);
        }
      }

      const syncResult = await pool.query(
        `UPDATE produtos
         SET estoque = $1,
             estoque_tamanhos = $2::jsonb,
             estoque_cores = $3::jsonb,
           estoque_variantes = $4::jsonb,
             data_atualizacao = NOW()
         WHERE id = $5
         RETURNING *`,
        [estoqueSincronizado, JSON.stringify(estoqueTamanhosSincronizado), JSON.stringify(estoqueCoresSincronizado), JSON.stringify(estoqueVariantesSincronizado), id]
      );

      result.rows[0] = syncResult.rows[0];
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

    // Buscar estado anterior do produto
    const produtoAnterior = await pool.query(
      'SELECT id, nome, estoque, ativo FROM produtos WHERE id = $1',
      [id]
    );

    if (produtoAnterior.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
      });
    }

    const produtoAntes = produtoAnterior.rows[0];
    const estoqueAntes = produtoAntes.estoque;
    const estaAtivoAntes = produtoAntes.ativo;
    const nomeProduto = produtoAntes.nome;

    // Atualizar estoque
    const result = await pool.query(
      `UPDATE produtos
       SET estoque = $1, data_atualizacao = NOW()
       WHERE id = $2
       RETURNING id, nome, estoque, ativo`,
      [novoEstoque, id]
    );

    const produtoAtualizado = result.rows[0];

    // Lógica de inativação/reativação automática
    if (novoEstoque === 0 && estaAtivoAntes) {
      // Estoque zerou → inativar
      await pool.query(
        'UPDATE produtos SET ativo = false WHERE id = $1',
        [id]
      );
      
      produtoAtualizado.ativo = false;

      // Notificar administradores
      notifyAdmins({
        tipoEvento: 'estoque_zerado_manual',
        titulo: '⚠️ Produto inativado (atualização manual)',
        mensagem: `O produto "${nomeProduto}" teve seu estoque atualizado para 0 e foi inativado automaticamente.`,
        payload: {
          produto_id: id,
          produto_nome: nomeProduto,
          estoque_anterior: estoqueAntes,
          estoque_atual: 0,
          tipo_atualizacao: 'manual'
        }
      }).catch(err => console.error('Erro ao notificar admins:', err));

    } else if (novoEstoque > 0 && !estaAtivoAntes && estoqueAntes === 0) {
      // Tinha estoque 0 e estava inativo → reativar
      await pool.query(
        'UPDATE produtos SET ativo = true WHERE id = $1',
        [id]
      );
      
      produtoAtualizado.ativo = true;

      // Notificar administradores
      notifyAdmins({
        tipoEvento: 'estoque_restaurado_manual',
        titulo: '✅ Produto reativado (atualização manual)',
        mensagem: `O produto "${nomeProduto}" teve seu estoque atualizado para ${novoEstoque} unidade(s) e foi reativado automaticamente.`,
        payload: {
          produto_id: id,
          produto_nome: nomeProduto,
          estoque_anterior: estoqueAntes,
          estoque_atual: novoEstoque,
          tipo_atualizacao: 'manual'
        }
      }).catch(err => console.error('Erro ao notificar admins:', err));
    }

    res.json({
      success: true,
      message: 'Estoque atualizado com sucesso',
      data: produtoAtualizado,
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
      'SELECT id, ativo FROM produtos WHERE id = $1',
      [id]
    );

    if (produtoExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
      });
    }

    const produto = produtoExiste.rows[0];

    if (produto.ativo) {
      // Soft delete - apenas desativar
      await pool.query(
        'UPDATE produtos SET ativo = false WHERE id = $1',
        [id]
      );

      return res.json({
        success: true,
        message: 'Produto desativado com sucesso',
        data: {
          hardDeleted: false,
        },
      });
    }

    // Se já está inativo, permite exclusão definitiva
    await pool.query(
      'DELETE FROM produtos WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Produto excluído definitivamente com sucesso',
      data: {
        hardDeleted: true,
      },
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json({
        success: false,
        error: 'Não é possível excluir definitivamente este produto porque existem registros vinculados. Mantenha-o inativo.',
      });
    }

    console.error('Erro ao deletar produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar produto',
    });
  }
};

module.exports = {
  listarProdutos,
  listarProdutosAdmin,
  obterProduto,
  listarPromocoes,
  listarDestaques,
  criarProduto,
  atualizarProduto,
  atualizarEstoque,
  deletarProduto,
};
