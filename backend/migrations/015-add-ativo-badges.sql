-- 015-add-ativo-badges.sql
-- Adiciona coluna ativo na tabela badges para compatibilidade com painel admin

ALTER TABLE badges
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

-- Garante valor padrão para registros antigos
UPDATE badges
SET ativo = TRUE
WHERE ativo IS NULL;
