ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS estoque_tamanhos JSONB DEFAULT '{}'::jsonb;

ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS vendidos_tamanhos JSONB DEFAULT '{}'::jsonb;

UPDATE produtos
SET estoque_tamanhos = '{}'::jsonb
WHERE estoque_tamanhos IS NULL;

UPDATE produtos
SET vendidos_tamanhos = '{}'::jsonb
WHERE vendidos_tamanhos IS NULL;

CREATE INDEX IF NOT EXISTS idx_produtos_estoque_tamanhos ON produtos USING GIN (estoque_tamanhos);
CREATE INDEX IF NOT EXISTS idx_produtos_vendidos_tamanhos ON produtos USING GIN (vendidos_tamanhos);
