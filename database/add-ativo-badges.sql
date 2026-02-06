-- Adicionar coluna 'ativo' à tabela 'badges' se não existir
ALTER TABLE badges
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
