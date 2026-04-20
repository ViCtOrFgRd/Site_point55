const { pool } = require('../config/database');

// Obter configuração fallback
const obterConfigFallback = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        cff.id,
        cff.tamanho,
        cff.caixa_id,
        cff.capacidade_media,
        cff.peso_medio_item,
        cff.updated_at,
        cc.codigo AS caixa_codigo,
        cc.nome AS caixa_nome,
        cc.altura AS caixa_altura,
        cc.largura AS caixa_largura,
        cc.comprimento AS caixa_comprimento,
        cc.peso_caixa
       FROM config_fallback_frete cff
       JOIN caixas_catalogo cc ON cc.id = cff.caixa_id
       ORDER BY CASE cff.tamanho WHEN 'P' THEN 1 WHEN 'M' THEN 2 WHEN 'G' THEN 3 END`
    );
    
    // Transformar em objeto com chaves P, M, G
    const config = {
      P: null,
      M: null,
      G: null
    };
    
    result.rows.forEach(row => {
      config[row.tamanho] = {
        id: row.id,
        tamanho: row.tamanho,
        caixa_id: row.caixa_id,
        capacidade_media: row.capacidade_media,
        peso_medio_item: parseFloat(row.peso_medio_item),
        updated_at: row.updated_at,
        caixa: {
          codigo: row.caixa_codigo,
          nome: row.caixa_nome,
          altura: parseFloat(row.caixa_altura),
          largura: parseFloat(row.caixa_largura),
          comprimento: parseFloat(row.caixa_comprimento),
          peso_caixa: parseFloat(row.peso_caixa)
        }
      };
    });
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Erro ao obter config fallback:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter configuração fallback',
      error: error.message
    });
  }
};

// Atualizar configuração fallback (admin)
const atualizarConfigFallback = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { P, M, G } = req.body;
    
    // Validações
    if (!P || !M || !G) {
      return res.status(400).json({
        success: false,
        message: 'Configurações para P, M e G são obrigatórias'
      });
    }
    
    const configs = { P, M, G };
    
    for (const [tamanho, config] of Object.entries(configs)) {
      if (!config.caixa_id || !config.capacidade_media || config.peso_medio_item === undefined) {
        return res.status(400).json({
          success: false,
          message: `Configuração ${tamanho}: caixa_id, capacidade_media e peso_medio_item são obrigatórios`
        });
      }
      
      if (config.capacidade_media <= 0) {
        return res.status(400).json({
          success: false,
          message: `Configuração ${tamanho}: capacidade_media deve ser maior que 0`
        });
      }
      
      if (config.peso_medio_item < 0) {
        return res.status(400).json({
          success: false,
          message: `Configuração ${tamanho}: peso_medio_item deve ser maior ou igual a 0`
        });
      }
      
      // Verificar se a caixa existe e está ativa
      const caixaResult = await client.query(
        'SELECT id, ativo FROM caixas_catalogo WHERE id = $1',
        [config.caixa_id]
      );
      
      if (caixaResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Configuração ${tamanho}: caixa não encontrada`
        });
      }
      
      if (!caixaResult.rows[0].ativo) {
        return res.status(400).json({
          success: false,
          message: `Configuração ${tamanho}: caixa está inativa`
        });
      }
    }
    
    // Iniciar transação
    await client.query('BEGIN');
    
    // Atualizar cada configuração
    for (const [tamanho, config] of Object.entries(configs)) {
      await client.query(
        `INSERT INTO config_fallback_frete (tamanho, caixa_id, capacidade_media, peso_medio_item, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (tamanho) 
         DO UPDATE SET 
           caixa_id = EXCLUDED.caixa_id,
           capacidade_media = EXCLUDED.capacidade_media,
           peso_medio_item = EXCLUDED.peso_medio_item,
           updated_at = CURRENT_TIMESTAMP`,
        [tamanho, config.caixa_id, config.capacidade_media, config.peso_medio_item]
      );
    }
    
    await client.query('COMMIT');
    
    // Buscar configuração atualizada
    const result = await client.query(
      `SELECT 
        cff.id,
        cff.tamanho,
        cff.caixa_id,
        cff.capacidade_media,
        cff.peso_medio_item,
        cff.updated_at,
        cc.codigo AS caixa_codigo,
        cc.nome AS caixa_nome,
        cc.altura AS caixa_altura,
        cc.largura AS caixa_largura,
        cc.comprimento AS caixa_comprimento,
        cc.peso_caixa
       FROM config_fallback_frete cff
       JOIN caixas_catalogo cc ON cc.id = cff.caixa_id
       ORDER BY CASE cff.tamanho WHEN 'P' THEN 1 WHEN 'M' THEN 2 WHEN 'G' THEN 3 END`
    );
    
    // Transformar em objeto com chaves P, M, G
    const config = {
      P: null,
      M: null,
      G: null
    };
    
    result.rows.forEach(row => {
      config[row.tamanho] = {
        id: row.id,
        tamanho: row.tamanho,
        caixa_id: row.caixa_id,
        capacidade_media: row.capacidade_media,
        peso_medio_item: parseFloat(row.peso_medio_item),
        updated_at: row.updated_at,
        caixa: {
          codigo: row.caixa_codigo,
          nome: row.caixa_nome,
          altura: parseFloat(row.caixa_altura),
          largura: parseFloat(row.caixa_largura),
          comprimento: parseFloat(row.caixa_comprimento),
          peso_caixa: parseFloat(row.peso_caixa)
        }
      };
    });
    
    res.json({
      success: true,
      message: 'Configuração fallback atualizada com sucesso',
      data: config
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar config fallback:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configuração fallback',
      error: error.message
    });
  } finally {
    client.release();
  }
};

module.exports = {
  obterConfigFallback,
  atualizarConfigFallback
};
