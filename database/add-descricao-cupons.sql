-- Adicionar coluna descricao na tabela cupons
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS descricao TEXT;
