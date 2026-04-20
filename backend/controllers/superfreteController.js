const {
  calcularFreteSuperfrete,
  obterInformacoesPacotesSuperfrete,
} = require('../services/superfreteService');
const { calcularVolumesFrete, formatarParaServicoFrete } = require('../services/embalagemService');

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
      itens, // Array de itens do carrinho para cálculo automático de volumes
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

    // Calcular volumes automaticamente se itens forem fornecidos
    let volumesParaFrete = null;
    
    if (itens && Array.isArray(itens) && itens.length > 0) {
      try {
        const volumes = await calcularVolumesFrete(itens);
        volumesParaFrete = formatarParaServicoFrete(volumes);
        
        console.log('📦 Volumes calculados:', {
          quantidade_volumes: volumesParaFrete.length,
          volumes: volumesParaFrete
        });
      } catch (error) {
        console.error('❌ Erro ao calcular volumes automaticamente:');
        console.error('   Mensagem:', error.message);
        console.error('   Stack:', error.stack);
        // Continuar com dimensões manuais se houver erro
      }
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
      volumes: volumesParaFrete, // Passar volumes calculados
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
    console.error('❌ ERRO NA FUNÇÃO calcularFrete:');
    console.error('   Mensagem:', error.message);
    console.error('   Stack:', error.stack);
    console.error('   Response Data:', error?.response?.data);
    
    return res.status(500).json({
      success: false,
      error: 'Erro ao calcular frete no SuperFrete',
      debug: {
        message: error.message,
        type: error.constructor.name
      }
    });
  }
};

// GET /api/superfrete/pacotes - Informacoes dos pacotes
const obterPacotes = async (req, res) => {
  try {
    const result = await obterInformacoesPacotesSuperfrete();
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Erro ao obter informacoes de pacotes:', error?.response?.data || error.message || error);
    const details = error?.response?.data || null;
    return res.status(500).json({
      success: false,
      error: 'Erro ao obter informacoes de pacotes no SuperFrete',
      details: process.env.NODE_ENV === 'development' ? details : undefined,
    });
  }
};

module.exports = {
  calcularFrete,
  obterPacotes,
};
