-- Cria tabelas de notificacoes
CREATE TABLE IF NOT EXISTS notificacoes (
    id SERIAL PRIMARY KEY,
    recipient_type VARCHAR(20) NOT NULL,
    recipient_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(50) NOT NULL,
    titulo VARCHAR(120) NOT NULL,
    mensagem TEXT NOT NULL,
    payload JSONB,
    lida_em TIMESTAMP,
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notificacoes_usuarios (
    notificacao_id INTEGER REFERENCES notificacoes(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    lida_em TIMESTAMP,
    apagada_em TIMESTAMP,
    PRIMARY KEY (notificacao_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_recipient_type ON notificacoes(recipient_type);
CREATE INDEX IF NOT EXISTS idx_notificacoes_recipient_id ON notificacoes(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida_em);
CREATE INDEX IF NOT EXISTS idx_notificacoes_criada ON notificacoes(criada_em);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuarios_usuario ON notificacoes_usuarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuarios_apagada ON notificacoes_usuarios(apagada_em);
