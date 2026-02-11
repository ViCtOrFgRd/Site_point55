-- Adiciona precos por forma de pagamento nos produtos
ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS preco_pix DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS preco_debito DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS preco_credito DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS preco_boleto DECIMAL(10, 2);

-- Preencher valores existentes com o preco atual
UPDATE produtos
SET preco_pix = COALESCE(preco_pix, preco),
    preco_debito = COALESCE(preco_debito, preco),
    preco_credito = COALESCE(preco_credito, preco),
    preco_boleto = COALESCE(preco_boleto, preco);
