-- Adiciona parcelas_maximas nos produtos
ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS parcelas_maximas INTEGER DEFAULT 3;

-- Preencher valores existentes com 3 parcelas
UPDATE produtos
SET parcelas_maximas = COALESCE(parcelas_maximas, 3);
