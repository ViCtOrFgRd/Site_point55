-- Cria tabelas de devolucoes e anexos
CREATE TABLE IF NOT EXISTS devolucoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE SET NULL,
    tipo VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'solicitado',
    motivo VARCHAR(120) NOT NULL,
    justificativa TEXT NOT NULL,
    observacoes TEXT,
    admin_decisao TEXT,
    admin_instrucoes TEXT,
    aprovado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    justificativa_recorrencia TEXT,
    data_recorrencia TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devolucao_itens (
    id SERIAL PRIMARY KEY,
    devolucao_id INTEGER REFERENCES devolucoes(id) ON DELETE CASCADE,
    pedido_item_id INTEGER REFERENCES itens_pedido(id) ON DELETE SET NULL,
    produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
    quantidade INTEGER NOT NULL,
    tamanho VARCHAR(10),
    cor VARCHAR(50),
    motivo_item VARCHAR(120)
);

CREATE TABLE IF NOT EXISTS devolucao_anexos (
    id SERIAL PRIMARY KEY,
    devolucao_id INTEGER REFERENCES devolucoes(id) ON DELETE CASCADE,
    arquivo_url TEXT NOT NULL,
    arquivo_nome VARCHAR(255),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_devolucoes_usuario ON devolucoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_devolucoes_pedido ON devolucoes(pedido_id);
CREATE INDEX IF NOT EXISTS idx_devolucoes_status ON devolucoes(status);
