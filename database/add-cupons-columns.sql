-- Adicionar colunas faltantes na tabela cupons
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS valor_minimo DECIMAL(10, 2) DEFAULT 0;
