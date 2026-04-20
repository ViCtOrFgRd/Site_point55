-- Adiciona coluna de estoque por variante (tamanho + cor)
ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS estoque_variantes JSONB DEFAULT '{}'::jsonb;

-- Normaliza registros existentes
UPDATE produtos
SET estoque_variantes = COALESCE(estoque_variantes, '{}'::jsonb);
