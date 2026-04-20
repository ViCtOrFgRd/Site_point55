-- Controle de votos úteis por comentário e usuário
CREATE TABLE IF NOT EXISTS comentarios_uteis (
  id SERIAL PRIMARY KEY,
  comentario_id INTEGER NOT NULL REFERENCES comentarios(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  data_voto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comentario_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_comentarios_uteis_comentario ON comentarios_uteis(comentario_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_uteis_usuario ON comentarios_uteis(usuario_id);
