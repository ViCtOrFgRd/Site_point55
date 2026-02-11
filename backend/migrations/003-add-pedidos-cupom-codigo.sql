-- Adiciona cupom_codigo aos pedidos
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS cupom_codigo VARCHAR(50);
