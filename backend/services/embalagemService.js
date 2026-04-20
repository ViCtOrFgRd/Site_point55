const { pool } = require('../config/database');

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
  console.log(`🔍 obterConfigEmbalagem chamado com tipoProdutoId: ${tipoProdutoId}`);

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
    
    console.log(`   Configuração tipo-específica encontrada: ${configResult.rows.length} registros`);
    
    if (configResult.rows.length === 3) {
      const config = { P: null, M: null, G: null };
      
      configResult.rows.forEach(row => {
        config[row.tamanho] = {
          caixa_id: row.caixa_id,
          capacidade: row.capacidade,
          peso_medio_item: parseFloat(row.peso_medio_item),
          caixa: {
            altura: parseFloat(row.caixa_altura),
            largura: parseFloat(row.caixa_largura),
            comprimento: parseFloat(row.caixa_comprimento),
            peso_caixa: parseFloat(row.peso_caixa)
          }
        };
      });
      
      console.log(`   ✅ Config específica retornada para tipo ${tipoProdutoId}`);
      return config;
    }
  }
  
  // Se não encontrou ou não tem tipo, usar fallback
  console.log('   Usando configuração fallback...');
  
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
     JOIN caixas_catalogo cc ON cc.id = cff.caixa_id
     WHERE cff.ativo = true`
  );
  
  console.log(`   Registros fallback encontrados: ${fallbackResult.rows.length}`);
  
  if (fallbackResult.rows.length === 0) {
    throw new Error('Nenhuma configuração de fallback encontrada na tabela config_fallback_frete');
  }
  
  const config = { P: null, M: null, G: null };
  
  fallbackResult.rows.forEach(row => {
    config[row.tamanho] = {
      caixa_id: row.caixa_id,
      capacidade: row.capacidade,
      peso_medio_item: parseFloat(row.peso_medio_item),
      caixa: {
        altura: parseFloat(row.caixa_altura),
        largura: parseFloat(row.caixa_largura),
        comprimento: parseFloat(row.caixa_comprimento),
        peso_caixa: parseFloat(row.peso_caixa)
      }
    };
  });
  
  return config;
}

/**
 * Calcula volumes de frete para itens de um pedido
 * Agrupa por tipo de produto e calcula volumes para cada grupo
 * 
 * @param {Array} itens - Array de itens do pedido [{ produto_id, quantidade, tipo_produto_id }]
 * @returns {Array} Array de volumes consolidados para o frete
 */
async function calcularVolumesFrete(itens) {
  console.log('📊 calcularVolumesFrete iniciado com itens:', itens);
  
  // Agrupar itens por tipo de produto
  const grupos = {};
  
  for (const item of itens) {
    const tipo = item.tipo_produto_id || 'sem_tipo';
    if (!grupos[tipo]) {
      grupos[tipo] = {
        tipo_produto_id: item.tipo_produto_id,
        quantidade_total: 0
      };
    }
    grupos[tipo].quantidade_total += item.quantidade;
  }
  
  console.log('📦 Grupos criados:', grupos);
  
  // Calcular volumes para cada grupo
  const todosVolumes = [];
  
  for (const [tipo, grupo] of Object.entries(grupos)) {
    console.log(`   Processando grupo tipo=${tipo}, quantidade=${grupo.quantidade_total}`);
    
    try {
      const config = await obterConfigEmbalagem(grupo.tipo_produto_id);
      
      if (!config || (!config.P && !config.M && !config.G)) {
        throw new Error(`Config vazia para tipo ${tipo}: ${JSON.stringify(config)}`);
      }
      
      const volumes = calcularVolumes(grupo.quantidade_total, config.P, config.M, config.G);
      console.log(`   ✅ ${volumes.length} volumes calculados para tipo ${tipo}`);
      todosVolumes.push(...volumes);
    } catch (error) {
      console.error(`   ❌ Erro ao processar tipo ${tipo}: ${error.message}`);
      throw error;
    }
  }
  
  console.log(`📦 Total de volumes antes consolidação: ${todosVolumes.length}`);
  
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
  
  console.log(`✅ ${volumesConsolidados.length} volumes após consolidação`);
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
