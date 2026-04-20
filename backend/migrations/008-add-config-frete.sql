-- Tabela de catálogo de caixas (P/M/G)
CREATE TABLE IF NOT EXISTS caixas_catalogo (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  tamanho VARCHAR(1) NOT NULL CHECK (tamanho IN ('P', 'M', 'G')),
  altura DECIMAL(10,2) NOT NULL CHECK (altura > 0 AND altura <= 200),
  largura DECIMAL(10,2) NOT NULL CHECK (largura > 0 AND largura <= 200),
  comprimento DECIMAL(10,2) NOT NULL CHECK (comprimento > 0 AND comprimento <= 200),
  peso_caixa DECIMAL(10,3) NOT NULL CHECK (peso_caixa >= 0 AND peso_caixa <= 50),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configuração fallback global
CREATE TABLE IF NOT EXISTS config_fallback_frete (
  id SERIAL PRIMARY KEY,
  tamanho VARCHAR(1) NOT NULL UNIQUE CHECK (tamanho IN ('P', 'M', 'G')),
  caixa_id INTEGER NOT NULL REFERENCES caixas_catalogo(id),
  capacidade_media INTEGER NOT NULL CHECK (capacidade_media > 0),
  peso_medio_item DECIMAL(10,3) NOT NULL CHECK (peso_medio_item >= 0),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de tipos de produto
CREATE TABLE IF NOT EXISTS tipos_produto (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configuração de embalagem por tipo de produto
CREATE TABLE IF NOT EXISTS config_embalagem_tipo (
  id SERIAL PRIMARY KEY,
  tipo_produto_id INTEGER NOT NULL REFERENCES tipos_produto(id) ON DELETE CASCADE,
  tamanho VARCHAR(1) NOT NULL CHECK (tamanho IN ('P', 'M', 'G')),
  caixa_id INTEGER NOT NULL REFERENCES caixas_catalogo(id),
  capacidade INTEGER NOT NULL CHECK (capacidade > 0),
  peso_medio_item DECIMAL(10,3) NOT NULL CHECK (peso_medio_item >= 0),
  observacoes TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tipo_produto_id, tamanho)
);

-- Adicionar coluna tipo_produto_id na tabela produtos (se não existir)
ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS tipo_produto_id INTEGER REFERENCES tipos_produto(id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_caixas_catalogo_tamanho ON caixas_catalogo(tamanho);
CREATE INDEX IF NOT EXISTS idx_caixas_catalogo_ativo ON caixas_catalogo(ativo);
CREATE INDEX IF NOT EXISTS idx_tipos_produto_ativo ON tipos_produto(ativo);
CREATE INDEX IF NOT EXISTS idx_config_embalagem_tipo_produto ON config_embalagem_tipo(tipo_produto_id);
CREATE INDEX IF NOT EXISTS idx_produtos_tipo_produto ON produtos(tipo_produto_id);

-- Seed: Caixas padrão (P/M/G)
INSERT INTO caixas_catalogo (codigo, nome, tamanho, altura, largura, comprimento, peso_caixa) VALUES
-- Pequenas
('P1', 'Pequena 1', 'P', 10, 15, 20, 0.1),
('P2', 'Pequena 2', 'P', 12, 18, 22, 0.15),
('P3', 'Pequena 3', 'P', 15, 20, 25, 0.2),

-- Médias
('M1', 'Média 1', 'M', 20, 25, 30, 0.3),
('M2', 'Média 2', 'M', 25, 30, 35, 0.4),
('M3', 'Média 3', 'M', 30, 35, 40, 0.5),

-- Grandes
('G1', 'Grande 1', 'G', 35, 40, 45, 0.6),
('G2', 'Grande 2', 'G', 40, 45, 50, 0.7),
('G3', 'Grande 3', 'G', 50, 55, 60, 0.9)
ON CONFLICT (codigo) DO NOTHING;

-- Seed: Configuração fallback padrão
INSERT INTO config_fallback_frete (tamanho, caixa_id, capacidade_media, peso_medio_item) 
SELECT 'P', id, 1, 0.5 FROM caixas_catalogo WHERE codigo = 'P1'
ON CONFLICT (tamanho) DO NOTHING;

INSERT INTO config_fallback_frete (tamanho, caixa_id, capacidade_media, peso_medio_item) 
SELECT 'M', id, 3, 0.5 FROM caixas_catalogo WHERE codigo = 'M1'
ON CONFLICT (tamanho) DO NOTHING;

INSERT INTO config_fallback_frete (tamanho, caixa_id, capacidade_media, peso_medio_item) 
SELECT 'G', id, 6, 0.5 FROM caixas_catalogo WHERE codigo = 'G1'
ON CONFLICT (tamanho) DO NOTHING;

-- Seed: Tipos de produto padrão
INSERT INTO tipos_produto (nome, codigo) VALUES
('Tênis', 'tenis'),
('Camiseta', 'camiseta'),
('Calça', 'calca'),
('Boné', 'bone'),
('Perfume', 'perfume'),
('Acessório', 'acessorio')
ON CONFLICT (codigo) DO NOTHING;
