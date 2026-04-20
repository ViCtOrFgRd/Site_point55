ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS superfrete_pedido_id TEXT,
  ADD COLUMN IF NOT EXISTS superfrete_etiqueta_id TEXT,
  ADD COLUMN IF NOT EXISTS superfrete_status TEXT,
  ADD COLUMN IF NOT EXISTS superfrete_etiqueta_url TEXT,
  ADD COLUMN IF NOT EXISTS superfrete_raw_json JSONB;
