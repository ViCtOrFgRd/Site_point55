const { calcularFreteSuperfrete } = require('../services/superfreteService');

const parseNumber = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const parsed = Number.parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const calcularFrete = async (req, res) => {
  try {
    const {
      cep_destino,
      valor_declarado,
      peso,
      altura,
      largura,
      comprimento,
      subtotal,
      services,
      options,
      payload,
    } = req.body || {};

    if (!cep_destino) {
      return res.status(400).json({
        success: false,
        error: 'CEP de destino e obrigatorio',
      });
    }

    const subtotalValue = parseNumber(subtotal);
    const freteGratisAcima = parseNumber(process.env.FRETE_GRATIS_ACIMA) ?? 200;

    if (subtotalValue !== null && subtotalValue >= freteGratisAcima) {
      return res.json({
        success: true,
        data: {
          valor: 0,
          prazo: null,
          servico: 'frete_gratis',
          cotacoes: [],
          raw: null,
        },
      });
    }

    const result = await calcularFreteSuperfrete({
      cepDestino: cep_destino,
      valorDeclarado: valor_declarado ?? subtotalValue,
      peso,
      altura,
      largura,
      comprimento,
      services,
      maoPropria: options?.own_hand,
      avisoRecebimento: options?.receipt,
      rawPayload: payload,
    });

    if (!result.best) {
      return res.status(502).json({
        success: false,
        error: 'Nao foi possivel obter cotacao de frete',
        data: {
          cotacoes: result.quotes,
          raw: result.raw,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        valor: result.best.valor,
        prazo: result.best.prazo ?? null,
        servico: result.best.servico ?? null,
        cotacoes: result.quotes,
        raw: result.raw,
      },
    });
  } catch (error) {
    console.error('Erro ao calcular frete:', error?.response?.data || error.message || error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao calcular frete no SuperFrete',
    });
  }
};

module.exports = {
  calcularFrete,
};
