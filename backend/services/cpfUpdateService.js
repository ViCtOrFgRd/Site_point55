const crypto = require('crypto');

let tableReady = false;

const ensureCpfUpdateTable = async (pool) => {
  if (tableReady) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cpf_confirmacoes (
      usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
      cpf_pendente VARCHAR(11) NOT NULL,
      codigo_hash VARCHAR(64) NOT NULL,
      expira_em TIMESTAMP NOT NULL,
      tentativas INTEGER NOT NULL DEFAULT 0,
      criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  tableReady = true;
};

const gerarCodigoCpf = () => {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
};

const hashCodigoCpf = (codigo) => {
  return crypto.createHash('sha256').update(String(codigo)).digest('hex');
};

const salvarCpfConfirmacao = async (pool, usuarioId, cpfPendente, codigo, expiraEm) => {
  await ensureCpfUpdateTable(pool);

  await pool.query(
    `INSERT INTO cpf_confirmacoes (usuario_id, cpf_pendente, codigo_hash, expira_em, tentativas, atualizado_em)
     VALUES ($1, $2, $3, $4, 0, NOW())
     ON CONFLICT (usuario_id) DO UPDATE
     SET cpf_pendente = EXCLUDED.cpf_pendente,
         codigo_hash = EXCLUDED.codigo_hash,
         expira_em = EXCLUDED.expira_em,
         tentativas = 0,
         atualizado_em = NOW()`,
    [usuarioId, cpfPendente, hashCodigoCpf(codigo), expiraEm]
  );
};

const obterCpfConfirmacao = async (pool, usuarioId) => {
  await ensureCpfUpdateTable(pool);

  const result = await pool.query(
    `SELECT usuario_id, cpf_pendente, codigo_hash, expira_em, tentativas, criado_em, atualizado_em
     FROM cpf_confirmacoes
     WHERE usuario_id = $1`,
    [usuarioId]
  );

  return result.rows[0] || null;
};

const incrementarTentativasCpf = async (pool, usuarioId) => {
  await ensureCpfUpdateTable(pool);

  await pool.query(
    `UPDATE cpf_confirmacoes
     SET tentativas = tentativas + 1,
         atualizado_em = NOW()
     WHERE usuario_id = $1`,
    [usuarioId]
  );
};

const removerCpfConfirmacao = async (pool, usuarioId) => {
  await ensureCpfUpdateTable(pool);
  await pool.query('DELETE FROM cpf_confirmacoes WHERE usuario_id = $1', [usuarioId]);
};

module.exports = {
  ensureCpfUpdateTable,
  gerarCodigoCpf,
  hashCodigoCpf,
  salvarCpfConfirmacao,
  obterCpfConfirmacao,
  incrementarTentativasCpf,
  removerCpfConfirmacao,
};