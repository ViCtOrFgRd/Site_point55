const toPositiveInt = (value) => {
  const parsed = Number.parseInt(String(value ?? '0'), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
};

const normalizeSizeKey = (size) => String(size || '').trim().toUpperCase();
const normalizeColorKey = (color) => String(color || '')
  .replace(/@\s*\d{1,3}\s*%?$/i, '')
  .trim()
  .toUpperCase();
const normalizeVariantKey = (size, color) => `${normalizeSizeKey(size)}|${normalizeColorKey(color)}`;

const parseVariantMap = (value, normalizer) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((acc, [key, raw]) => {
    const normalizedKey = normalizer(key);
    if (!normalizedKey) return acc;
    acc[normalizedKey] = toPositiveInt(raw);
    return acc;
  }, {});
};

const parseSizeMap = (value) => {
  return parseVariantMap(value, normalizeSizeKey);
};

const parseColorMap = (value) => {
  return parseVariantMap(value, normalizeColorKey);
};

const parseVariantStockMap = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((acc, [rawKey, rawQty]) => {
    const [sizeRaw = '', colorRaw = ''] = String(rawKey || '').split('|');
    const key = normalizeVariantKey(sizeRaw, colorRaw);
    const [sizeKey, colorKey] = key.split('|');
    if (!sizeKey && !colorKey) return acc;
    acc[key] = toPositiveInt(rawQty);
    return acc;
  }, {});
};

const hasSizeStockControl = (produto) => {
  const map = parseSizeMap(produto?.estoque_tamanhos);
  return Object.keys(map).length > 0;
};

const hasColorStockControl = (produto) => {
  const map = parseColorMap(produto?.estoque_cores);
  return Object.keys(map).length > 0;
};

const hasVariantStockControl = (produto) => {
  const map = parseVariantStockMap(produto?.estoque_variantes);
  return Object.keys(map).length > 0;
};

const getSizeStock = (produto, size) => {
  const sizeKey = normalizeSizeKey(size);
  if (!sizeKey) return null;
  const map = parseSizeMap(produto?.estoque_tamanhos);
  if (Object.keys(map).length === 0) return null;
  return map[sizeKey] ?? 0;
};

const getColorStock = (produto, color) => {
  const colorKey = normalizeColorKey(color);
  if (!colorKey) return null;
  const map = parseColorMap(produto?.estoque_cores);
  if (Object.keys(map).length === 0) return null;
  return map[colorKey] ?? 0;
};

const getVariantStock = (produto, size, color) => {
  const variantKey = normalizeVariantKey(size, color);
  const map = parseVariantStockMap(produto?.estoque_variantes);
  if (Object.keys(map).length === 0) return null;
  return map[variantKey] ?? 0;
};

const sumSizeStock = (stockMap) => Object.values(stockMap).reduce((acc, qty) => acc + toPositiveInt(qty), 0);
const sumColorStock = (stockMap) => Object.values(stockMap).reduce((acc, qty) => acc + toPositiveInt(qty), 0);
const sumVariantStock = (stockMap) => Object.values(stockMap).reduce((acc, qty) => acc + toPositiveInt(qty), 0);

const applySizeStockMovement = ({
  stockMap,
  soldMap,
  size,
  quantity,
  movement,
  adjustSales,
}) => {
  const sizeKey = normalizeSizeKey(size);
  if (!sizeKey) {
    return {
      ok: false,
      reason: 'Tamanho não informado',
    };
  }

  const current = toPositiveInt(stockMap[sizeKey]);

  if (movement === 'saida' && current < quantity) {
    return {
      ok: false,
      reason: `Estoque insuficiente para tamanho ${sizeKey}. Disponível: ${current}`,
    };
  }

  if (movement === 'saida') {
    stockMap[sizeKey] = current - quantity;
  } else {
    stockMap[sizeKey] = current + quantity;
  }

  if (adjustSales) {
    const currentSold = toPositiveInt(soldMap[sizeKey]);
    if (movement === 'saida') {
      soldMap[sizeKey] = currentSold + quantity;
    } else {
      soldMap[sizeKey] = Math.max(0, currentSold - quantity);
    }
  }

  return { ok: true };
};

const applyColorStockMovement = ({
  stockMap,
  color,
  quantity,
  movement,
}) => {
  const colorKey = normalizeColorKey(color);
  if (!colorKey) {
    return {
      ok: false,
      reason: 'Cor não informada',
    };
  }

  const current = toPositiveInt(stockMap[colorKey]);

  if (movement === 'saida' && current < quantity) {
    return {
      ok: false,
      reason: `Estoque insuficiente para cor ${colorKey}. Disponível: ${current}`,
    };
  }

  if (movement === 'saida') {
    stockMap[colorKey] = current - quantity;
  } else {
    stockMap[colorKey] = current + quantity;
  }

  return { ok: true };
};

const applyVariantStockMovement = ({
  stockMap,
  size,
  color,
  quantity,
  movement,
}) => {
  const variantKey = normalizeVariantKey(size, color);
  const [sizeKey, colorKey] = variantKey.split('|');

  if (!sizeKey || !colorKey) {
    return {
      ok: false,
      reason: 'Tamanho e cor devem ser informados para esta variação',
    };
  }

  const current = toPositiveInt(stockMap[variantKey]);

  if (movement === 'saida' && current < quantity) {
    return {
      ok: false,
      reason: `Estoque insuficiente para ${sizeKey}/${colorKey}. Disponível: ${current}`,
    };
  }

  if (movement === 'saida') {
    stockMap[variantKey] = current - quantity;
  } else {
    stockMap[variantKey] = current + quantity;
  }

  return { ok: true };
};

const adjustProductStock = async (dbClient, {
  produtoId,
  quantidade,
  tamanho,
  cor,
  movement = 'saida',
  adjustSales = true,
}) => {
  const qty = toPositiveInt(quantidade);
  if (qty <= 0) {
    return { success: true, skipped: true };
  }

  const result = await dbClient.query(
    `SELECT id, nome, estoque, ativo, estoque_tamanhos, estoque_cores, estoque_variantes, vendidos_tamanhos, tamanhos_disponiveis, vendas_total
     FROM produtos
     WHERE id = $1
     FOR UPDATE`,
    [produtoId]
  );

  if (result.rowCount === 0) {
    return { success: false, error: `Produto ${produtoId} não encontrado` };
  }

  const produto = result.rows[0];
  const variantStockMap = parseVariantStockMap(produto.estoque_variantes);
  const stockMap = parseSizeMap(produto.estoque_tamanhos);
  const colorStockMap = parseColorMap(produto.estoque_cores);
  const soldMap = parseSizeMap(produto.vendidos_tamanhos);
  const controlsByVariant = Object.keys(variantStockMap).length > 0;
  const controlsBySize = Object.keys(stockMap).length > 0;
  const controlsByColor = Object.keys(colorStockMap).length > 0;

  let novoEstoque = toPositiveInt(produto.estoque);
  let vendasDelta = 0;

  if (controlsByVariant) {
    const movementResult = applyVariantStockMovement({
      stockMap: variantStockMap,
      size: tamanho,
      color: cor,
      quantity: qty,
      movement,
    });

    if (!movementResult.ok) {
      return {
        success: false,
        error: movementResult.reason,
      };
    }

    novoEstoque = sumVariantStock(variantStockMap);
    if (adjustSales) {
      vendasDelta = movement === 'saida' ? qty : -qty;
    }
  } else if (controlsBySize) {
    const movementResult = applySizeStockMovement({
      stockMap,
      soldMap,
      size: tamanho,
      quantity: qty,
      movement,
      adjustSales,
    });

    if (!movementResult.ok) {
      return {
        success: false,
        error: movementResult.reason,
      };
    }

    novoEstoque = sumSizeStock(stockMap);
    if (adjustSales) {
      vendasDelta = movement === 'saida' ? qty : -qty;
    }
  } else if (controlsByColor) {
    const movementResult = applyColorStockMovement({
      stockMap: colorStockMap,
      color: cor,
      quantity: qty,
      movement,
    });

    if (!movementResult.ok) {
      return {
        success: false,
        error: movementResult.reason,
      };
    }

    novoEstoque = sumColorStock(colorStockMap);
    if (adjustSales) {
      vendasDelta = movement === 'saida' ? qty : -qty;
    }
  } else {
    if (movement === 'saida' && novoEstoque < qty) {
      return {
        success: false,
        error: `Estoque insuficiente. Disponível: ${novoEstoque}`,
      };
    }

    novoEstoque = movement === 'saida' ? (novoEstoque - qty) : (novoEstoque + qty);
    if (adjustSales) {
      vendasDelta = movement === 'saida' ? qty : -qty;
    }
  }

  const updateResult = await dbClient.query(
    `UPDATE produtos
     SET estoque = $1,
         estoque_tamanhos = $2::jsonb,
         estoque_cores = $3::jsonb,
       estoque_variantes = $4::jsonb,
       vendidos_tamanhos = $5::jsonb,
       vendas_total = GREATEST(0, COALESCE(vendas_total, 0) + $6),
         ativo = CASE
           WHEN $1 <= 0 THEN false
           WHEN ativo = false AND $1 > 0 THEN true
           ELSE ativo
         END,
         data_atualizacao = NOW()
     WHERE id = $7
     RETURNING id, nome, estoque, ativo, estoque_tamanhos, estoque_cores, estoque_variantes, vendidos_tamanhos, vendas_total`,
    [
      novoEstoque,
      JSON.stringify(stockMap),
      JSON.stringify(colorStockMap),
      JSON.stringify(variantStockMap),
      JSON.stringify(soldMap),
      vendasDelta,
      produtoId,
    ]
  );

  return {
    success: true,
    data: updateResult.rows[0],
    controlsByVariant,
    controlsBySize,
    controlsByColor,
  };
};

const registerProductSale = async (dbClient, {
  produtoId,
  quantidade,
  tamanho,
  cor,
}) => {
  const qty = toPositiveInt(quantidade);
  if (qty <= 0) {
    return { success: true, skipped: true };
  }

  const result = await dbClient.query(
    `SELECT id, vendidos_tamanhos
     FROM produtos
     WHERE id = $1
     FOR UPDATE`,
    [produtoId]
  );

  if (result.rowCount === 0) {
    return { success: false, error: `Produto ${produtoId} não encontrado` };
  }

  const soldMap = parseSizeMap(result.rows[0].vendidos_tamanhos);
  const sizeKey = normalizeSizeKey(tamanho);
  if (sizeKey) {
    soldMap[sizeKey] = toPositiveInt(soldMap[sizeKey]) + qty;
  }

  const updateResult = await dbClient.query(
    `UPDATE produtos
     SET vendidos_tamanhos = $1::jsonb,
         vendas_total = COALESCE(vendas_total, 0) + $2,
         data_atualizacao = NOW()
     WHERE id = $3
     RETURNING id, vendas_total, vendidos_tamanhos`,
    [JSON.stringify(soldMap), qty, produtoId]
  );

  return {
    success: true,
    data: updateResult.rows[0],
  };
};

module.exports = {
  normalizeSizeKey,
  normalizeColorKey,
  normalizeVariantKey,
  parseSizeMap,
  parseColorMap,
  parseVariantStockMap,
  hasVariantStockControl,
  hasSizeStockControl,
  hasColorStockControl,
  getVariantStock,
  getSizeStock,
  getColorStock,
  adjustProductStock,
  registerProductSale,
};
