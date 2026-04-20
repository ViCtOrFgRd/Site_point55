SET client_encoding = 'UTF8';

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
);

CREATE INDEX IF NOT EXISTS idx_conteudos_institucionais_ativo_ordem
ON conteudos_institucionais (ativo, ordem, slug);

INSERT INTO conteudos_institucionais (slug, titulo, resumo, conteudo_html, ativo, ordem)
VALUES
  ('sobre', 'Sobre Nós', '', '', true, 1),
  ('politica', 'Política de Privacidade', '', '', true, 2),
  ('termos', 'Termos de Uso', '', '', true, 3),
  ('trocas', 'Trocas e Devoluções', '', '', true, 4),
  ('faq', 'FAQ - Perguntas Frequentes', '', '', true, 5),
  ('satisfacao', 'Pesquisa de Satisfação', '', '', true, 6),
  ('tabela-medidas', 'Tabela de Medidas', '', '', true, 7),
  ('frete', 'Política de Frete', '', '', true, 8)
ON CONFLICT (slug) DO NOTHING;
