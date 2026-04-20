const crypto = require('crypto');

let tableReady = false;

const ensureRetiradaCodigoTable = async (pool) => {
  if (tableReady) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS retirada_codigos (
      pedido_id INTEGER PRIMARY KEY REFERENCES pedidos(id) ON DELETE CASCADE,
      codigo VARCHAR(20) NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  tableReady = true;
};

const gerarCodigoRetirada = (pagamentoNaRetirada = false) => {
  const prefixo = pagamentoNaRetirada ? '01' : '11';
  const random = crypto.randomInt(0, 1000000);
  const sufixo = String(random).padStart(6, '0');
  return `${prefixo}${sufixo}`;
};

const hashCodigoRetirada = (codigo) => {
  return crypto.createHash('sha256').update(String(codigo)).digest('hex');
};

const saveRetiradaCodigo = async (pool, pedidoId, codigo) => {
  await ensureRetiradaCodigoTable(pool);

  await pool.query(
    `INSERT INTO retirada_codigos (pedido_id, codigo)
     VALUES ($1, $2)
     ON CONFLICT (pedido_id) DO UPDATE
     SET codigo = EXCLUDED.codigo,
         criado_em = CURRENT_TIMESTAMP`,
    [pedidoId, codigo]
  );
};

const getRetiradaCodigo = async (pool, pedidoId) => {
  await ensureRetiradaCodigoTable(pool);

  const result = await pool.query(
    'SELECT codigo FROM retirada_codigos WHERE pedido_id = $1',
    [pedidoId]
  );

  return result.rows[0]?.codigo || null;
};

module.exports = {
  ensureRetiradaCodigoTable,
  gerarCodigoRetirada,
  hashCodigoRetirada,
  saveRetiradaCodigo,
  getRetiradaCodigo,
};
