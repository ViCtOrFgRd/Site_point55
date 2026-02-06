-- Script para adicionar/atualizar tabelas de cupons e newsletter
-- Execute este script se as tabelas já existirem no banco

-- Atualizar tabela de cupons
ALTER TABLE cupons 
ADD COLUMN IF NOT EXISTS descricao TEXT;

ALTER TABLE cupons 
ALTER COLUMN data_validade DROP NOT NULL;

-- Renomear coluna se necessário
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'cupons' AND column_name = 'valor_minimo_pedido') THEN
        ALTER TABLE cupons RENAME COLUMN valor_minimo_pedido TO valor_minimo;
    END IF;
END $$;

-- Atualizar tabela de newsletter
ALTER TABLE newsletter 
ADD COLUMN IF NOT EXISTS data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Mensagem de sucesso
SELECT 'Tabelas atualizadas com sucesso!' as status;
