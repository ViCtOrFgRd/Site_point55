-- Adiciona coluna de estoque por cor nos produtos
ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS estoque_cores JSONB DEFAULT '{}'::jsonb;

-- Normaliza registros existentes
UPDATE produtos
SET estoque_cores = COALESCE(estoque_cores, '{}'::jsonb);
