const { pool } = require('../config/database');

const obterPromocoesAtivas = async (client = pool) => {
  const result = await client.query(
    `SELECT id, tipo_desconto, desconto_percentual, desconto_valor, produtos_aplicaveis
     FROM promocoes
     WHERE ativa = true
       AND data_inicio <= NOW()
       AND data_fim >= NOW()`
  );

  return result.rows || [];
};

const aplicarPromocaoProduto = (produto, promocoesAtivas) => {
  if (!produto || !promocoesAtivas || promocoesAtivas.length === 0) {
    return produto;
  }

  const precoBase = parseFloat(produto.preco);
  const precoOriginal = parseFloat(produto.preco_original || produto.preco);
  const baseParaTeto = !Number.isNaN(precoBase) && precoBase > 0 ? precoBase : precoOriginal;

  if (!precoOriginal || Number.isNaN(precoOriginal) || precoOriginal <= 0) {
    return produto;
  }

  let melhorDesconto = 0;
  let promocaoAplicada = null;

  for (const promo of promocoesAtivas) {
    const aplicavel =
      promo.produtos_aplicaveis == null ||
      promo.produtos_aplicaveis.length === 0 ||
      promo.produtos_aplicaveis.includes(produto.id);

    if (!aplicavel) {
      continue;
    }

    let desconto = 0;

    if (promo.tipo_desconto === 'percentual') {
      desconto = promo.desconto_percentual || 0;
    } else if (promo.tipo_desconto === 'valor_fixo') {
      if (precoBase > 0) {
        desconto = ((promo.desconto_valor || 0) / precoBase) * 100;
      }
    }

    if (desconto > melhorDesconto) {
      melhorDesconto = desconto;
      promocaoAplicada = promo;
    }
  }

  if (melhorDesconto > 0 && promocaoAplicada) {
    let novoPreco;

    if (promocaoAplicada.tipo_desconto === 'percentual') {
      novoPreco = precoOriginal * (1 - melhorDesconto / 100);
    } else {
      novoPreco = precoOriginal - (promocaoAplicada.desconto_valor || 0);
    }

    novoPreco = Math.min(novoPreco, baseParaTeto);
    novoPreco = Math.max(novoPreco, 0.01);

    return {
      ...produto,
      preco_original: precoOriginal,
      preco: novoPreco.toFixed(2),
      desconto_percentual: Math.round(melhorDesconto),
      promocao_aplicada: {
        id: promocaoAplicada.id,
        tipo: promocaoAplicada.tipo_desconto,
        valor: melhorDesconto,
      },
    };
  }

  return produto;
};

const aplicarPromocoes = async (produtos, client) => {
  if (!produtos || produtos.length === 0) {
    return produtos;
  }

  const promocoesAtivas = await obterPromocoesAtivas(client || pool);

  if (promocoesAtivas.length === 0) {
    return produtos;
  }

  return produtos.map((produto) => aplicarPromocaoProduto(produto, promocoesAtivas));
};

module.exports = {
  obterPromocoesAtivas,
  aplicarPromocaoProduto,
  aplicarPromocoes,
};
