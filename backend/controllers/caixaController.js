const { pool } = require('../config/database');

// Listar todas as caixas do catálogo
const listarCaixas = async (req, res) => {
  try {
    const { tamanho, ativo } = req.query;
    
    let query = 'SELECT * FROM caixas_catalogo';
    const conditions = [];
    const params = [];
    
    if (tamanho) {
      params.push(tamanho.toUpperCase());
      conditions.push(`tamanho = $${params.length}`);
    }
    
    if (ativo !== undefined) {
      params.push(ativo === 'true');
      conditions.push(`ativo = $${params.length}`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY CASE tamanho WHEN \'P\' THEN 1 WHEN \'M\' THEN 2 WHEN \'G\' THEN 3 END, codigo';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar caixas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar caixas',
      error: error.message
    });
  }
};

// Obter caixa específica
const obterCaixa = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM caixas_catalogo WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Caixa não encontrada'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao obter caixa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter caixa',
      error: error.message
    });
  }
};

// Criar nova caixa (admin)
const criarCaixa = async (req, res) => {
  try {
    const {
      codigo,
      nome,
      tamanho,
      altura,
      largura,
      comprimento,
      peso_caixa
    } = req.body;
    
    // Validações
    if (!codigo || !nome || !tamanho || !altura || !largura || !comprimento || peso_caixa === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }
    
    if (!['P', 'M', 'G'].includes(tamanho.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Tamanho deve ser P, M ou G'
      });
    }
    
    if (altura <= 0 || altura > 200 || largura <= 0 || largura > 200 || comprimento <= 0 || comprimento > 200) {
      return res.status(400).json({
        success: false,
        message: 'Dimensões devem ser maiores que 0 e menores ou iguais a 200 cm'
      });
    }
    
    if (peso_caixa < 0 || peso_caixa > 50) {
      return res.status(400).json({
        success: false,
        message: 'Peso da caixa deve estar entre 0 e 50 kg'
      });
    }
    
    if (codigo.length < 2 || codigo.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Código deve ter entre 2 e 10 caracteres'
      });
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(codigo)) {
      return res.status(400).json({
        success: false,
        message: 'Código deve conter apenas letras e números'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO caixas_catalogo (codigo, nome, tamanho, altura, largura, comprimento, peso_caixa)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [codigo.toUpperCase(), nome, tamanho.toUpperCase(), altura, largura, comprimento, peso_caixa]
    );
    
    res.status(201).json({
      success: true,
      message: 'Caixa criada com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar caixa:', error);
    
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        message: 'Código já existe'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro ao criar caixa',
      error: error.message
    });
  }
};

// Atualizar caixa (admin)
const atualizarCaixa = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      altura,
      largura,
      comprimento,
      peso_caixa,
      ativo
    } = req.body;
    
    // Validações
    if (altura !== undefined && (altura <= 0 || altura > 200)) {
      return res.status(400).json({
        success: false,
        message: 'Altura deve ser maior que 0 e menor ou igual a 200 cm'
      });
    }
    
    if (largura !== undefined && (largura <= 0 || largura > 200)) {
      return res.status(400).json({
        success: false,
        message: 'Largura deve ser maior que 0 e menor ou igual a 200 cm'
      });
    }
    
    if (comprimento !== undefined && (comprimento <= 0 || comprimento > 200)) {
      return res.status(400).json({
        success: false,
        message: 'Comprimento deve ser maior que 0 e menor ou igual a 200 cm'
      });
    }
    
    if (peso_caixa !== undefined && (peso_caixa < 0 || peso_caixa > 50)) {
      return res.status(400).json({
        success: false,
        message: 'Peso da caixa deve estar entre 0 e 50 kg'
      });
    }
    
    const fields = [];
    const params = [];
    let paramIndex = 1;
    
    if (nome !== undefined) {
      fields.push(`nome = $${paramIndex++}`);
      params.push(nome);
    }
    
    if (altura !== undefined) {
      fields.push(`altura = $${paramIndex++}`);
      params.push(altura);
    }
    
    if (largura !== undefined) {
      fields.push(`largura = $${paramIndex++}`);
      params.push(largura);
    }
    
    if (comprimento !== undefined) {
      fields.push(`comprimento = $${paramIndex++}`);
      params.push(comprimento);
    }
    
    if (peso_caixa !== undefined) {
      fields.push(`peso_caixa = $${paramIndex++}`);
      params.push(peso_caixa);
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
      UPDATE caixas_catalogo 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Caixa não encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Caixa atualizada com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar caixa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar caixa',
      error: error.message
    });
  }
};

// Desativar caixa (admin)
const desativarCaixa = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a caixa está em uso
    const usoResult = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM config_fallback_frete WHERE caixa_id = $1) +
        (SELECT COUNT(*) FROM config_embalagem_tipo WHERE caixa_id = $1) AS total_uso`,
      [id]
    );
    
    if (usoResult.rows[0].total_uso > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível desativar esta caixa pois ela está em uso',
        em_uso: true
      });
    }
    
    const result = await pool.query(
      `UPDATE caixas_catalogo 
       SET ativo = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Caixa não encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Caixa desativada com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao desativar caixa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao desativar caixa',
      error: error.message
    });
  }
};

// Verificar uso da caixa (admin)
const verificarUso = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        c.id, c.codigo, c.nome,
        (SELECT COUNT(*) FROM config_fallback_frete WHERE caixa_id = c.id) AS uso_fallback,
        (SELECT COUNT(*) FROM config_embalagem_tipo WHERE caixa_id = c.id) AS uso_tipos,
        (
          SELECT json_agg(json_build_object('id', tp.id, 'nome', tp.nome))
          FROM config_embalagem_tipo cet
          JOIN tipos_produto tp ON tp.id = cet.tipo_produto_id
          WHERE cet.caixa_id = c.id
        ) AS tipos_vinculados
       FROM caixas_catalogo c
       WHERE c.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Caixa não encontrada'
      });
    }
    
    const caixa = result.rows[0];
    const em_uso = parseInt(caixa.uso_fallback) + parseInt(caixa.uso_tipos) > 0;
    
    res.json({
      success: true,
      em_uso,
      uso_fallback: parseInt(caixa.uso_fallback),
      uso_tipos: parseInt(caixa.uso_tipos),
      tipos_vinculados: caixa.tipos_vinculados || []
    });
  } catch (error) {
    console.error('Erro ao verificar uso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar uso',
      error: error.message
    });
  }
};

module.exports = {
  listarCaixas,
  obterCaixa,
  criarCaixa,
  atualizarCaixa,
  desativarCaixa,
  verificarUso
};
