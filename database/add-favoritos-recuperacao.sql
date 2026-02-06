-- Tabela para tokens de recuperação de senha
CREATE TABLE IF NOT EXISTS tokens_recuperacao_senha (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expira_em TIMESTAMP NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tokens_recuperacao_token ON tokens_recuperacao_senha(token);
CREATE INDEX IF NOT EXISTS idx_tokens_recuperacao_usuario ON tokens_recuperacao_senha(usuario_id);

-- Tabela de favoritos
CREATE TABLE IF NOT EXISTS favoritos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, produto_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON favoritos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_produto ON favoritos(produto_id);

-- Comentários
COMMENT ON TABLE tokens_recuperacao_senha IS 'Tokens para recuperação de senha (válidos por 1 hora)';
COMMENT ON TABLE favoritos IS 'Lista de produtos favoritos dos usuários';
