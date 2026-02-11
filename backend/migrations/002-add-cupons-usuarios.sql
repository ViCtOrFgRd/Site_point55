-- Tabela de uso de cupons por usuario
CREATE TABLE IF NOT EXISTS cupons_usuarios (
	id SERIAL PRIMARY KEY,
	cupom_id INTEGER NOT NULL REFERENCES cupons(id) ON DELETE CASCADE,
	usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
	pedido_id INTEGER REFERENCES pedidos(id) ON DELETE SET NULL,
	data_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	UNIQUE(cupom_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_cupons_usuarios_cupom ON cupons_usuarios(cupom_id);
CREATE INDEX IF NOT EXISTS idx_cupons_usuarios_usuario ON cupons_usuarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cupons_usuarios_pedido ON cupons_usuarios(pedido_id);
CREATE INDEX IF NOT EXISTS idx_cupons_usuarios_data ON cupons_usuarios(data_uso);
