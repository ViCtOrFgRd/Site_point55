const { pool } = require('../config/database');

// Listar todos os tipos de produto
const listarTipos = async (req, res) => {
  try {
    const { ativo } = req.query;
    
    let query = 'SELECT * FROM tipos_produto';
    const params = [];
    
    if (ativo !== undefined) {
      params.push(ativo === 'true');
      query += ` WHERE ativo = $1`;
    }
    
    query += ' ORDER BY nome';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar tipos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar tipos de produto',
      error: error.message
    });
  }
};

// Obter tipo específico
const obterTipo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM tipos_produto WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de produto não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao obter tipo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter tipo de produto',
      error: error.message
    });
  }
};

// Criar novo tipo de produto (admin)
const criarTipo = async (req, res) => {
  try {
    const { nome, codigo } = req.body;
    
    if (!nome || !codigo) {
      return res.status(400).json({
        success: false,
        message: 'Nome e código são obrigatórios'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO tipos_produto (nome, codigo)
       VALUES ($1, $2)
       RETURNING *`,
      [nome, codigo.toLowerCase()]
    );
    
    res.status(201).json({
      success: true,
      message: 'Tipo de produto criado com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar tipo:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Código ou nome já existe'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro ao criar tipo de produto',
      error: error.message
    });
  }
};

// Atualizar tipo de produto (admin)
const atualizarTipo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, ativo } = req.body;
    
    const fields = [];
    const params = [];
    let paramIndex = 1;
    
    if (nome !== undefined) {
      fields.push(`nome = $${paramIndex++}`);
      params.push(nome);
    }
    
    if (ativo !== undefined) {
      fields.push(`ativo = $${paramIndex++}`);
      params.push(ativo);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo para atualizar'
      });
    }
    
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);
    
    const query = `
      UPDATE tipos_produto 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de produto não encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Tipo de produto atualizado com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar tipo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar tipo de produto',
      error: error.message
    });
  }
};

// Obter configuração de embalagem de um tipo
const obterConfigEmbalagem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o tipo existe
    const tipoResult = await pool.query(
      'SELECT * FROM tipos_produto WHERE id = $1',
      [id]
    );
    
    if (tipoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de produto não encontrado'
      });
    }
    
    const result = await pool.query(
      `SELECT 
        cet.id,
        cet.tamanho,
        cet.caixa_id,
        cet.capacidade,
        cet.peso_medio_item,
        cet.observacoes,
        cet.updated_at,
        cc.codigo AS caixa_codigo,
        cc.nome AS caixa_nome,
        cc.altura AS caixa_altura,
        cc.largura AS caixa_largura,
        cc.comprimento AS caixa_comprimento,
        cc.peso_caixa
       FROM config_embalagem_tipo cet
       JOIN caixas_catalogo cc ON cc.id = cet.caixa_id
       WHERE cet.tipo_produto_id = $1
       ORDER BY CASE cet.tamanho WHEN 'P' THEN 1 WHEN 'M' THEN 2 WHEN 'G' THEN 3 END`,
      [id]
    );
    
    // Transformar em objeto com chaves P, M, G
    const config = {
      tipo: tipoResult.rows[0],
      embalagens: {
        P: null,
        M: null,
        G: null
      }
    };
    
    result.rows.forEach(row => {
      config.embalagens[row.tamanho] = {
        id: row.id,
        tamanho: row.tamanho,
        caixa_id: row.caixa_id,
        capacidade: row.capacidade,
        peso_medio_item: parseFloat(row.peso_medio_item),
        observacoes: row.observacoes,
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
    console.error('Erro ao obter config embalagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter configuração de embalagem',
      error: error.message
    });
  }
};

// Atualizar configuração de embalagem de um tipo (admin)
const atualizarConfigEmbalagem = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { P, M, G } = req.body;
    
    // Verificar se o tipo existe
    const tipoResult = await client.query(
      'SELECT * FROM tipos_produto WHERE id = $1',
      [id]
    );
    
    if (tipoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de produto não encontrado'
      });
    }
    
    // Validações
    if (!P || !M || !G) {
      return res.status(400).json({
        success: false,
        message: 'Configurações para P, M e G são obrigatórias'
      });
    }
    
    const configs = { P, M, G };
    const capacidades = [];
    
    for (const [tamanho, config] of Object.entries(configs)) {
      if (!config.caixa_id || !config.capacidade || config.peso_medio_item === undefined) {
        return res.status(400).json({
          success: false,
          message: `Configuração ${tamanho}: caixa_id, capacidade e peso_medio_item são obrigatórios`
        });
      }
      
      if (config.capacidade <= 0) {
        return res.status(400).json({
          success: false,
          message: `Configuração ${tamanho}: capacidade deve ser maior que 0`
        });
      }
      
      if (config.peso_medio_item < 0) {
        return res.status(400).json({
          success: false,
          message: `Configuração ${tamanho}: peso_medio_item deve ser maior ou igual a 0`
        });
      }
      
      capacidades.push(config.capacidade);
      
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
    
    // Validar que as capacidades são diferentes
    if (new Set(capacidades).size !== capacidades.length) {
      return res.status(400).json({
        success: false,
        message: 'As capacidades P, M e G devem ser diferentes'
      });
    }
    
    // Iniciar transação
    await client.query('BEGIN');
    
    // Deletar configurações existentes
    await client.query(
      'DELETE FROM config_embalagem_tipo WHERE tipo_produto_id = $1',
      [id]
    );
    
    // Inserir novas configurações
    for (const [tamanho, config] of Object.entries(configs)) {
      await client.query(
        `INSERT INTO config_embalagem_tipo 
         (tipo_produto_id, tamanho, caixa_id, capacidade, peso_medio_item, observacoes, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [id, tamanho, config.caixa_id, config.capacidade, config.peso_medio_item, config.observacoes || null]
      );
    }
    
    await client.query('COMMIT');
    
    // Buscar configuração atualizada
    const result = await client.query(
      `SELECT 
        cet.id,
        cet.tamanho,
        cet.caixa_id,
        cet.capacidade,
        cet.peso_medio_item,
        cet.observacoes,
        cet.updated_at,
        cc.codigo AS caixa_codigo,
        cc.nome AS caixa_nome,
        cc.altura AS caixa_altura,
        cc.largura AS caixa_largura,
        cc.comprimento AS caixa_comprimento,
        cc.peso_caixa
       FROM config_embalagem_tipo cet
       JOIN caixas_catalogo cc ON cc.id = cet.caixa_id
       WHERE cet.tipo_produto_id = $1
       ORDER BY CASE cet.tamanho WHEN 'P' THEN 1 WHEN 'M' THEN 2 WHEN 'G' THEN 3 END`,
      [id]
    );
    
    // Transformar em objeto com chaves P, M, G
    const config = {
      tipo: tipoResult.rows[0],
      embalagens: {
        P: null,
        M: null,
        G: null
      }
    };
    
    result.rows.forEach(row => {
      config.embalagens[row.tamanho] = {
        id: row.id,
        tamanho: row.tamanho,
        caixa_id: row.caixa_id,
        capacidade: row.capacidade,
        peso_medio_item: parseFloat(row.peso_medio_item),
        observacoes: row.observacoes,
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
      message: 'Configuração de embalagem atualizada com sucesso',
      data: config
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar config embalagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configuração de embalagem',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Duplicar configuração de outro tipo (admin)
const duplicarConfig = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { tipo_origem_id } = req.body;
    
    if (!tipo_origem_id) {
      return res.status(400).json({
        success: false,
        message: 'tipo_origem_id é obrigatório'
      });
    }
    
    // Verificar se ambos os tipos existem
    const tipoDestinoResult = await client.query(
      'SELECT * FROM tipos_produto WHERE id = $1',
      [id]
    );
    
    if (tipoDestinoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de destino não encontrado'
      });
    }
    
    const tipoOrigemResult = await client.query(
      'SELECT * FROM tipos_produto WHERE id = $1',
      [tipo_origem_id]
    );
    
    if (tipoOrigemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de origem não encontrado'
      });
    }
    
    // Buscar configuração do tipo de origem
    const configOrigemResult = await client.query(
      'SELECT * FROM config_embalagem_tipo WHERE tipo_produto_id = $1',
      [tipo_origem_id]
    );
    
    if (configOrigemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de origem não possui configuração de embalagem'
      });
    }
    
    // Iniciar transação
    await client.query('BEGIN');
    
    // Deletar configurações existentes do destino
    await client.query(
      'DELETE FROM config_embalagem_tipo WHERE tipo_produto_id = $1',
      [id]
    );
    
    // Copiar configurações da origem para o destino
    for (const config of configOrigemResult.rows) {
      await client.query(
        `INSERT INTO config_embalagem_tipo 
         (tipo_produto_id, tamanho, caixa_id, capacidade, peso_medio_item, observacoes, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [id, config.tamanho, config.caixa_id, config.capacidade, config.peso_medio_item, config.observacoes]
      );
    }
    
    await client.query('COMMIT');
    
    // Buscar configuração duplicada
    const result = await client.query(
      `SELECT 
        cet.id,
        cet.tamanho,
        cet.caixa_id,
        cet.capacidade,
        cet.peso_medio_item,
        cet.observacoes,
        cet.updated_at,
        cc.codigo AS caixa_codigo,
        cc.nome AS caixa_nome,
        cc.altura AS caixa_altura,
        cc.largura AS caixa_largura,
        cc.comprimento AS caixa_comprimento,
        cc.peso_caixa
       FROM config_embalagem_tipo cet
       JOIN caixas_catalogo cc ON cc.id = cet.caixa_id
       WHERE cet.tipo_produto_id = $1
       ORDER BY CASE cet.tamanho WHEN 'P' THEN 1 WHEN 'M' THEN 2 WHEN 'G' THEN 3 END`,
      [id]
    );
    
    // Transformar em objeto com chaves P, M, G
    const config = {
      tipo: tipoDestinoResult.rows[0],
      embalagens: {
        P: null,
        M: null,
        G: null
      }
    };
    
    result.rows.forEach(row => {
      config.embalagens[row.tamanho] = {
        id: row.id,
        tamanho: row.tamanho,
        caixa_id: row.caixa_id,
        capacidade: row.capacidade,
        peso_medio_item: parseFloat(row.peso_medio_item),
        observacoes: row.observacoes,
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
      message: `Configuração duplicada de "${tipoOrigemResult.rows[0].nome}" com sucesso`,
      data: config
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao duplicar config:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao duplicar configuração',
      error: error.message
    });
  } finally {
    client.release();
  }
};

module.exports = {
  listarTipos,
  obterTipo,
  criarTipo,
  atualizarTipo,
  obterConfigEmbalagem,
  atualizarConfigEmbalagem,
  duplicarConfig
};
