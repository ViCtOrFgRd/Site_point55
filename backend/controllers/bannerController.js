const { pool } = require('../config/database');

// Listar todos os banners (público)
const listarBanners = async (req, res) => {
  try {
    const { ativos_apenas } = req.query;
    
    let query = 'SELECT * FROM banners';
    const conditions = [];
    
    if (ativos_apenas === 'true') {
      conditions.push('ativo = true');
      
      // Filtrar por período de vigência por data (dia inteiro)
      conditions.push(`(
        (data_inicio IS NULL OR data_inicio::date <= CURRENT_DATE) AND
        (data_fim IS NULL OR data_fim::date >= CURRENT_DATE)
      )`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY ordem ASC, data_criacao DESC';
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar banners:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar banners',
      error: error.message
    });
  }
};

// Obter banner específico
const obterBanner = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM banners WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Banner não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao obter banner:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter banner',
      error: error.message
    });
  }
};

// Criar novo banner (admin)
const criarBanner = async (req, res) => {
  try {
    const {
      titulo,
      subtitulo,
      texto_botao,
      link_botao,
      imagem,
      cor_fundo,
      ordem,
      ativo,
      data_inicio,
      data_fim
    } = req.body;
    
    // Validações
    if (!titulo) {
      return res.status(400).json({
        success: false,
        message: 'Título é obrigatório'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO banners (
        titulo, subtitulo, texto_botao, link_botao, imagem, 
        cor_fundo, ordem, ativo, data_inicio, data_fim
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        titulo,
        subtitulo || null,
        texto_botao || null,
        link_botao || null,
        imagem || null,
        cor_fundo || '#0C1C3A',
        ordem || 0,
        ativo !== undefined ? ativo : true,
        data_inicio || null,
        data_fim || null
      ]
    );
    
    res.status(201).json({
      success: true,
      message: 'Banner criado com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar banner:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar banner',
      error: error.message
    });
  }
};

// Atualizar banner (admin)
const atualizarBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      subtitulo,
      texto_botao,
      link_botao,
      imagem,
      cor_fundo,
      ordem,
      ativo,
      data_inicio,
      data_fim
    } = req.body;
    
    // Verificar se banner existe
    const checkBanner = await pool.query(
      'SELECT * FROM banners WHERE id = $1',
      [id]
    );
    
    if (checkBanner.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Banner não encontrado'
      });
    }
    
    const result = await pool.query(
      `UPDATE banners SET
        titulo = COALESCE($1, titulo),
        subtitulo = COALESCE($2, subtitulo),
        texto_botao = COALESCE($3, texto_botao),
        link_botao = COALESCE($4, link_botao),
        imagem = COALESCE($5, imagem),
        cor_fundo = COALESCE($6, cor_fundo),
        ordem = COALESCE($7, ordem),
        ativo = COALESCE($8, ativo),
        data_inicio = COALESCE($9, data_inicio),
        data_fim = COALESCE($10, data_fim),
        data_atualizacao = NOW()
      WHERE id = $11
      RETURNING *`,
      [
        titulo,
        subtitulo,
        texto_botao,
        link_botao,
        imagem,
        cor_fundo,
        ordem,
        ativo,
        data_inicio,
        data_fim,
        id
      ]
    );
    
    res.json({
      success: true,
      message: 'Banner atualizado com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar banner:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar banner',
      error: error.message
    });
  }
};

// Alternar status do banner (admin)
const alternarStatusBanner = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se banner existe
    const checkBanner = await pool.query(
      'SELECT * FROM banners WHERE id = $1',
      [id]
    );
    
    if (checkBanner.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Banner não encontrado'
      });
    }
    
    const novoStatus = !checkBanner.rows[0].ativo;
    
    const result = await pool.query(
      `UPDATE banners SET ativo = $1, data_atualizacao = NOW()
       WHERE id = $2
       RETURNING *`,
      [novoStatus, id]
    );
    
    res.json({
      success: true,
      message: `Banner ${novoStatus ? 'ativado' : 'desativado'} com sucesso`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao alternar status do banner:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao alternar status do banner',
      error: error.message
    });
  }
};

// Reordenar banners (admin)
const reordenarBanners = async (req, res) => {
  try {
    const { banners } = req.body; // Array de { id, ordem }
    
    if (!Array.isArray(banners)) {
      return res.status(400).json({
        success: false,
        message: 'Formato inválido. Envie um array de banners com id e ordem'
      });
    }
    
    // Atualizar ordem de cada banner
    for (const banner of banners) {
      await pool.query(
        'UPDATE banners SET ordem = $1, data_atualizacao = NOW() WHERE id = $2',
        [banner.ordem, banner.id]
      );
    }
    
    // Retornar lista atualizada
    const result = await pool.query(
      'SELECT * FROM banners ORDER BY ordem ASC'
    );
    
    res.json({
      success: true,
      message: 'Ordem dos banners atualizada com sucesso',
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao reordenar banners:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao reordenar banners',
      error: error.message
    });
  }
};

// Deletar banner (admin)
const deletarBanner = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se banner existe
    const checkBanner = await pool.query(
      'SELECT * FROM banners WHERE id = $1',
      [id]
    );
    
    if (checkBanner.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Banner não encontrado'
      });
    }
    
    await pool.query('DELETE FROM banners WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Banner deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar banner:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar banner',
      error: error.message
    });
  }
};

module.exports = {
  listarBanners,
  obterBanner,
  criarBanner,
  atualizarBanner,
  alternarStatusBanner,
  reordenarBanners,
  deletarBanner
};
