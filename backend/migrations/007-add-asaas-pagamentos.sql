ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(64),
  ADD COLUMN IF NOT EXISTS asaas_payment_id VARCHAR(64),
  ADD COLUMN IF NOT EXISTS asaas_payment_status VARCHAR(32),
  ADD COLUMN IF NOT EXISTS asaas_billing_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS asaas_due_date DATE,
  ADD COLUMN IF NOT EXISTS asaas_invoice_url TEXT,
  ADD COLUMN IF NOT EXISTS asaas_boleto_url TEXT,
  ADD COLUMN IF NOT EXISTS asaas_pix_qr_code TEXT,
  ADD COLUMN IF NOT EXISTS asaas_pix_payload TEXT;
