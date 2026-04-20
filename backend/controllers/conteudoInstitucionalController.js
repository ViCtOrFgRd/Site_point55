const { pool } = require('../config/database');

const DEFAULT_SLOTS = [
  { slug: 'sobre', titulo: 'Sobre Nós', ordem: 1 },
  { slug: 'politica', titulo: 'Política de Privacidade', ordem: 2 },
  { slug: 'termos', titulo: 'Termos de Uso', ordem: 3 },
  { slug: 'trocas', titulo: 'Trocas e Devoluções', ordem: 4 },
  { slug: 'faq', titulo: 'FAQ - Perguntas Frequentes', ordem: 5 },
  { slug: 'satisfacao', titulo: 'Pesquisa de Satisfação', ordem: 6 },
  { slug: 'tabela-medidas', titulo: 'Tabela de Medidas', ordem: 7 },
  { slug: 'frete', titulo: 'Política de Frete', ordem: 8 },
];

let initialized = false;
let initPromise = null;

const initSchema = async () => {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conteudos_institucionais (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(80) UNIQUE NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        resumo TEXT,
        conteudo_html TEXT,
        ativo BOOLEAN NOT NULL DEFAULT true,
        ordem INTEGER NOT NULL DEFAULT 0,
        atualizado_por INTEGER,
        criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_conteudos_institucionais_ativo_ordem
      ON conteudos_institucionais (ativo, ordem, slug)
    `);

    for (const item of DEFAULT_SLOTS) {
      await pool.query(
        `
          INSERT INTO conteudos_institucionais (slug, titulo, resumo, conteudo_html, ativo, ordem)
          VALUES ($1, $2, '', '', true, $3)
          ON CONFLICT (slug) DO NOTHING
        `,
        [item.slug, item.titulo, item.ordem]
      );
    }

    initialized = true;
  })();

  return initPromise;
};

const validarSlug = (value = '') => /^[a-z0-9-]{2,80}$/.test(value);

const listarConteudosPublicos = async (req, res) => {
  try {
    await initSchema();
    const result = await pool.query(
      `
      SELECT slug, titulo, resumo, atualizado_em
      FROM conteudos_institucionais
      WHERE ativo = true
      ORDER BY ordem ASC, slug ASC
      `
    );

    return res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Erro ao listar conteúdos institucionais públicos:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao listar conteúdos institucionais',
    });
  }
};

const obterConteudoPublico = async (req, res) => {
  try {
    await initSchema();
    const { slug } = req.params;

    if (!validarSlug(slug)) {
      return res.status(400).json({
        success: false,
        error: 'Slug inválido',
      });
    }

    const result = await pool.query(
      `
      SELECT slug, titulo, resumo, conteudo_html, atualizado_em
      FROM conteudos_institucionais
      WHERE slug = $1 AND ativo = true
      LIMIT 1
      `,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conteúdo institucional não encontrado',
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao obter conteúdo institucional público:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao obter conteúdo institucional',
    });
  }
};

const listarConteudosAdmin = async (req, res) => {
  try {
    await initSchema();
    const result = await pool.query(
      `
      SELECT id, slug, titulo, resumo, ativo, ordem, atualizado_em, atualizado_por
      FROM conteudos_institucionais
      ORDER BY ordem ASC, slug ASC
      `
    );

    return res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Erro ao listar conteúdos institucionais (admin):', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao listar conteúdos institucionais',
    });
  }
};

const obterConteudoAdmin = async (req, res) => {
  try {
    await initSchema();
    const { slug } = req.params;

    if (!validarSlug(slug)) {
      return res.status(400).json({
        success: false,
        error: 'Slug inválido',
      });
    }

    const result = await pool.query(
      `
      SELECT id, slug, titulo, resumo, conteudo_html, ativo, ordem, atualizado_em, atualizado_por
      FROM conteudos_institucionais
      WHERE slug = $1
      LIMIT 1
      `,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conteúdo institucional não encontrado',
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao obter conteúdo institucional (admin):', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao obter conteúdo institucional',
    });
  }
};

const salvarConteudoAdmin = async (req, res) => {
  try {
    await initSchema();
    const { slug } = req.params;
    const { titulo, resumo, conteudo_html, ativo, ordem } = req.body || {};

    if (!validarSlug(slug)) {
      return res.status(400).json({
        success: false,
        error: 'Slug inválido',
      });
    }

    if (!titulo || !String(titulo).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Título é obrigatório',
      });
    }

    const result = await pool.query(
      `
      INSERT INTO conteudos_institucionais (slug, titulo, resumo, conteudo_html, ativo, ordem, atualizado_por, atualizado_em)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (slug)
      DO UPDATE SET
        titulo = EXCLUDED.titulo,
        resumo = EXCLUDED.resumo,
        conteudo_html = EXCLUDED.conteudo_html,
        ativo = EXCLUDED.ativo,
        ordem = EXCLUDED.ordem,
        atualizado_por = EXCLUDED.atualizado_por,
        atualizado_em = NOW()
      RETURNING id, slug, titulo, resumo, conteudo_html, ativo, ordem, atualizado_em, atualizado_por
      `,
      [
        slug,
        String(titulo).trim(),
        resumo ? String(resumo).trim() : '',
        conteudo_html ? String(conteudo_html) : '',
        ativo !== false,
        Number.isFinite(Number(ordem)) ? Number(ordem) : 0,
        req.usuario?.id || null,
      ]
    );

    return res.json({
      success: true,
      message: 'Conteúdo institucional salvo com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao salvar conteúdo institucional (admin):', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao salvar conteúdo institucional',
    });
  }
};

module.exports = {
  listarConteudosPublicos,
  obterConteudoPublico,
  listarConteudosAdmin,
  obterConteudoAdmin,
  salvarConteudoAdmin,
};
