-- Retirada local: campos em pedidos
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS entrega_tipo VARCHAR(20) DEFAULT 'entrega',
  ADD COLUMN IF NOT EXISTS retirada_codigo_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS retirada_codigo_gerado_em TIMESTAMP,
  ADD COLUMN IF NOT EXISTS retirada_confirmada_em TIMESTAMP,
  ADD COLUMN IF NOT EXISTS retirada_confirmada_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS retirada_confirmado_por_nome VARCHAR(255),
  ADD COLUMN IF NOT EXISTS retirada_observacao TEXT,
  ADD COLUMN IF NOT EXISTS pagamento_na_retirada BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS retirada_prazo_vencimento DATE,
  ADD COLUMN IF NOT EXISTS retirada_cancelado_automatico BOOLEAN DEFAULT FALSE;

-- Auditoria de retiradas (tentativas e eventos)
CREATE TABLE IF NOT EXISTS retirada_auditoria (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
  admin_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo_evento VARCHAR(50),
  descricao TEXT,
  ip_admin VARCHAR(45),
  data_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configuração de locais/horarios de retirada
CREATE TABLE IF NOT EXISTS retirada_config (
  id SERIAL PRIMARY KEY,
  nome_local VARCHAR(255) NOT NULL,
  endereco VARCHAR(255) NOT NULL,
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(9),
  horario_segunda_sabado VARCHAR(20),
  horario_domingo VARCHAR(20),
  horario_feriados VARCHAR(20),
  prazo_dias_retirada INTEGER DEFAULT 7,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_entrega_tipo ON pedidos(entrega_tipo);
CREATE INDEX IF NOT EXISTS idx_pedidos_retirada_prazo ON pedidos(retirada_prazo_vencimento);
CREATE INDEX IF NOT EXISTS idx_retirada_auditoria_pedido ON retirada_auditoria(pedido_id);