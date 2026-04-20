const { pool } = require('../config/database');

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

const parsePositiveNumber = (value, fallback) => {
  const parsed = parseNumber(value);
  if (parsed !== null && parsed > 0) {
    return parsed;
  }
  return fallback;
};

const mapearConfigPorTamanho = (rows) => {
  const config = { P: null, M: null, G: null };

  rows.forEach((row) => {
    if (!config[row.tamanho]) {
      config[row.tamanho] = {
        caixa_id: row.caixa_id,
        capacidade: parsePositiveNumber(row.capacidade, 1),
        peso_medio_item: parsePositiveNumber(row.peso_medio_item, 0.5),
        caixa: {
          altura: parsePositiveNumber(row.caixa_altura, 4),
          largura: parsePositiveNumber(row.caixa_largura, 12),
          comprimento: parsePositiveNumber(row.caixa_comprimento, 17),
          peso_caixa: parsePositiveNumber(row.peso_caixa, 0.1),
        },
      };
    }
  });

  return config;
};

const configCompleta = (config) => !!(config && config.P && config.M && config.G);

const criarConfigPadraoAmbiente = () => {
  const altura = parsePositiveNumber(process.env.SUPERFRETE_ALTURA_PADRAO, 4);
  const largura = parsePositiveNumber(process.env.SUPERFRETE_LARGURA_PADRAO, 12);
  const comprimento = parsePositiveNumber(process.env.SUPERFRETE_COMPRIMENTO_PADRAO, 17);
  const pesoMedioItem = parsePositiveNumber(process.env.SUPERFRETE_PESO_PADRAO, 0.5);
  const pesoCaixa = parsePositiveNumber(process.env.EMBALAGEM_PESO_CAIXA_PADRAO, 0.1);

  const capacidades = {
    P: parsePositiveNumber(process.env.EMBALAGEM_CAPACIDADE_P, 1),
    M: parsePositiveNumber(process.env.EMBALAGEM_CAPACIDADE_M, 3),
    G: parsePositiveNumber(process.env.EMBALAGEM_CAPACIDADE_G, 6),
  };

  return {
    P: {
      caixa_id: null,
      capacidade: capacidades.P,
      peso_medio_item: pesoMedioItem,
      caixa: { altura, largura, comprimento, peso_caixa: pesoCaixa },
    },
    M: {
      caixa_id: null,
      capacidade: capacidades.M,
      peso_medio_item: pesoMedioItem,
      caixa: { altura, largura, comprimento, peso_caixa: pesoCaixa },
    },
    G: {
      caixa_id: null,
      capacidade: capacidades.G,
      peso_medio_item: pesoMedioItem,
      caixa: { altura, largura, comprimento, peso_caixa: pesoCaixa },
    },
  };
};

const resolverTiposProdutoAusentes = async (itens = []) => {
  const ids = [
    ...new Set(
      itens
        .filter((item) => !item.tipo_produto_id && item.produto_id)
        .map((item) => Number.parseInt(item.produto_id, 10))
        .filter((id) => Number.isInteger(id) && id > 0)
    ),
  ];

  if (ids.length === 0) {
    return itens;
  }

  const result = await pool.query(
    'SELECT id, tipo_produto_id FROM produtos WHERE id = ANY($1::int[])',
    [ids]
  );

  const tipoPorProduto = new Map(
    result.rows.map((row) => [row.id, row.tipo_produto_id ?? null])
  );

  return itens.map((item) => {
    if (item.tipo_produto_id) {
      return item;
    }

    const produtoId = Number.parseInt(item.produto_id, 10);
    if (!Number.isInteger(produtoId) || produtoId <= 0) {
      return item;
    }

    const tipoProdutoId = tipoPorProduto.get(produtoId);
    if (tipoProdutoId) {
      return { ...item, tipo_produto_id: tipoProdutoId };
    }

    return item;
  });
};

/**
 * Serviço de empacotamento para cálculo de frete
 * Implementa algoritmo de distribuição de itens em caixas P/M/G
 */

/**
 * Calcula os volumes necessários para empacotar uma quantidade de itens
 * usando as configurações de caixas P/M/G
 * 
 * @param {number} quantidade - Quantidade de itens a empacotar
 * @param {Object} configP - Configuração da caixa P { caixa_id, capacidade, peso_medio_item, caixa: {...} }
 * @param {Object} configM - Configuração da caixa M
 * @param {Object} configG - Configuração da caixa G
 * @returns {Array} Array de volumes { caixa_id, quantidade_caixas, peso_total, dimensoes }
 */
function calcularVolumes(quantidade, configP, configM, configG) {
  if (!configP || !configM || !configG) {
    throw new Error('Configurações P, M e G são obrigatórias');
  }
  
  const volumes = [];
  let restante = quantidade;
  
  const capacidades = [
    { config: configG, tamanho: 'G' },
    { config: configM, tamanho: 'M' },
    { config: configP, tamanho: 'P' }
  ].sort((a, b) => b.config.capacidade - a.config.capacidade);
  
  // Usar a maior caixa que cabe exatamente
  for (const { config, tamanho } of capacidades) {
    const qtdCaixas = Math.floor(restante / config.capacidade);
    
    if (qtdCaixas > 0) {
      const pesoVolume = (config.capacidade * config.peso_medio_item) + config.caixa.peso_caixa;
      
      volumes.push({
        caixa_id: config.caixa_id,
        tamanho,
        quantidade_caixas: qtdCaixas,
        capacidade: config.capacidade,
        peso_unitario: parseFloat(pesoVolume.toFixed(3)),
        peso_total: parseFloat((pesoVolume * qtdCaixas).toFixed(3)),
        dimensoes: {
          altura: config.caixa.altura,
          largura: config.caixa.largura,
          comprimento: config.caixa.comprimento,
          peso: pesoVolume
        }
      });
      
      restante -= qtdCaixas * config.capacidade;
    }
  }
  
  // Se sobrou, usar a menor caixa
  if (restante > 0) {
    const config = configP;
    const qtdCaixas = Math.ceil(restante / config.capacidade);
    const pesoVolume = (config.capacidade * config.peso_medio_item) + config.caixa.peso_caixa;
    
    // Verificar se já tem volume P, se sim, somar
    const volumeP = volumes.find(v => v.tamanho === 'P');
    if (volumeP) {
      volumeP.quantidade_caixas += qtdCaixas;
      volumeP.peso_total = parseFloat((volumeP.peso_unitario * volumeP.quantidade_caixas).toFixed(3));
    } else {
      volumes.push({
        caixa_id: config.caixa_id,
        tamanho: 'P',
        quantidade_caixas: qtdCaixas,
        capacidade: config.capacidade,
        peso_unitario: parseFloat(pesoVolume.toFixed(3)),
        peso_total: parseFloat((pesoVolume * qtdCaixas).toFixed(3)),
        dimensoes: {
          altura: config.caixa.altura,
          largura: config.caixa.largura,
          comprimento: config.caixa.comprimento,
          peso: pesoVolume
        }
      });
    }
  }
  
  return volumes;
}

/**
 * Obtém a configuração de embalagem para um tipo de produto
 * Se não houver, retorna a configuração fallback
 * 
 * @param {number} tipoProdutoId - ID do tipo de produto
 * @returns {Object} Configuração { P: {...}, M: {...}, G: {...} }
 */
async function obterConfigEmbalagem(tipoProdutoId) {
  console.info(`🔍 obterConfigEmbalagem chamado com tipoProdutoId: ${tipoProdutoId}`);

  // Buscar configuração do tipo
  if (tipoProdutoId) {
    const configResult = await pool.query(
      `SELECT 
        cet.tamanho,
        cet.caixa_id,
        cet.capacidade,
        cet.peso_medio_item,
        cc.altura AS caixa_altura,
        cc.largura AS caixa_largura,
        cc.comprimento AS caixa_comprimento,
        cc.peso_caixa
       FROM config_embalagem_tipo cet
       JOIN caixas_catalogo cc ON cc.id = cet.caixa_id
       WHERE cet.tipo_produto_id = $1`,
      [tipoProdutoId]
    );
    
    console.info(`   Configuração tipo-específica encontrada: ${configResult.rows.length} registros`);
    
    const configTipo = mapearConfigPorTamanho(configResult.rows);

    if (configCompleta(configTipo)) {
      console.info(`   ✅ Config específica retornada para tipo ${tipoProdutoId}`);
      return configTipo;
    }

    if (configResult.rows.length > 0) {
      console.warn(`   ⚠️ Config específica incompleta para tipo ${tipoProdutoId}; usando fallback`);
    }
  }
  
  // Se não encontrou ou não tem tipo, usar fallback
  console.info('   Usando configuração fallback...');
  
  const fallbackResult = await pool.query(
    `SELECT 
      cff.tamanho,
      cff.caixa_id,
      cff.capacidade_media AS capacidade,
      cff.peso_medio_item,
      cc.altura AS caixa_altura,
      cc.largura AS caixa_largura,
      cc.comprimento AS caixa_comprimento,
      cc.peso_caixa
      FROM config_fallback_frete cff
      JOIN caixas_catalogo cc ON cc.id = cff.caixa_id`
  );
  
  console.info(`   Registros fallback encontrados: ${fallbackResult.rows.length}`);
  
  if (fallbackResult.rows.length === 0) {
    console.warn('   ⚠️ Tabela config_fallback_frete vazia; usando config padrão de ambiente');
    return criarConfigPadraoAmbiente();
  }

  const fallbackConfig = mapearConfigPorTamanho(fallbackResult.rows);
  if (configCompleta(fallbackConfig)) {
    return fallbackConfig;
  }

  console.warn('   ⚠️ Config fallback incompleta; preenchendo tamanhos ausentes com padrão de ambiente');
  const configPadrao = criarConfigPadraoAmbiente();
  return {
    P: fallbackConfig.P || configPadrao.P,
    M: fallbackConfig.M || configPadrao.M,
    G: fallbackConfig.G || configPadrao.G,
  };
}

/**
 * Calcula volumes de frete para itens de um pedido
 * Agrupa por tipo de produto e calcula volumes para cada grupo
 * 
 * @param {Array} itens - Array de itens do pedido [{ produto_id, quantidade, tipo_produto_id }]
 * @returns {Array} Array de volumes consolidados para o frete
 */
async function calcularVolumesFrete(itens) {
  console.info('📊 calcularVolumesFrete iniciado com itens:', itens);

  const itensResolvidos = await resolverTiposProdutoAusentes(itens);
  
  // Agrupar itens por tipo de produto
  const grupos = {};
  
  for (const item of itensResolvidos) {
    const tipo = item.tipo_produto_id || 'sem_tipo';
    if (!grupos[tipo]) {
      grupos[tipo] = {
        tipo_produto_id: item.tipo_produto_id,
        quantidade_total: 0
      };
    }
    grupos[tipo].quantidade_total += item.quantidade;
  }
  
  console.info('📦 Grupos criados:', grupos);
  
  // Calcular volumes para cada grupo
  const todosVolumes = [];
  
  for (const [tipo, grupo] of Object.entries(grupos)) {
    console.info(`   Processando grupo tipo=${tipo}, quantidade=${grupo.quantidade_total}`);
    
    try {
      const config = await obterConfigEmbalagem(grupo.tipo_produto_id);
      
      if (!config || (!config.P && !config.M && !config.G)) {
        throw new Error(`Config vazia para tipo ${tipo}: ${JSON.stringify(config)}`);
      }
      
      const volumes = calcularVolumes(grupo.quantidade_total, config.P, config.M, config.G);
      console.info(`   ✅ ${volumes.length} volumes calculados para tipo ${tipo}`);
      todosVolumes.push(...volumes);
    } catch (error) {
      console.error(`   ❌ Erro ao processar tipo ${tipo}: ${error.message}`);
      throw error;
    }
  }
  
  console.info(`📦 Total de volumes antes consolidação: ${todosVolumes.length}`);
  
  // Consolidar volumes iguais (mesma caixa)
  const volumesConsolidados = [];
  
  for (const volume of todosVolumes) {
    const volumeExistente = volumesConsolidados.find(v => v.caixa_id === volume.caixa_id);
    
    if (volumeExistente) {
      volumeExistente.quantidade_caixas += volume.quantidade_caixas;
      volumeExistente.peso_total = parseFloat((volumeExistente.peso_total + volume.peso_total).toFixed(3));
    } else {
      volumesConsolidados.push({ ...volume });
    }
  }
  
  console.info(`✅ ${volumesConsolidados.length} volumes após consolidação`);
  return volumesConsolidados;
}

/**
 * Formata volumes para envio ao serviço de frete (Correios, Superfrete, etc)
 * 
 * @param {Array} volumes - Array de volumes calculados
 * @returns {Array} Array formatado para API de frete
 */
function formatarParaServicoFrete(volumes) {
  const volumesFormatados = [];
  
  for (const volume of volumes) {
    // Adicionar cada caixa individualmente
    for (let i = 0; i < volume.quantidade_caixas; i++) {
      volumesFormatados.push({
        height: volume.dimensoes.altura,
        width: volume.dimensoes.largura,
        length: volume.dimensoes.comprimento,
        weight: volume.peso_unitario
      });
    }
  }
  
  return volumesFormatados;
}

module.exports = {
  calcularVolumes,
  obterConfigEmbalagem,
  calcularVolumesFrete,
  formatarParaServicoFrete
};
