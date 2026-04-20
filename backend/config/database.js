const { Pool } = require('pg');
require('dotenv').config();

const parseNumber = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientConnectionError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  const causeMessage = String(error?.cause?.message || '').toLowerCase();
  const combined = `${message} ${causeMessage}`;

  return [
    'connection terminated unexpectedly',
    'connection terminated due to connection timeout',
    'timeout expired',
    'econnreset',
    'the database system is starting up',
  ].some((snippet) => combined.includes(snippet));
};

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseNumber(process.env.DB_PORT, 5432),
  database: process.env.DB_NAME || 'point55',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: parseNumber(process.env.DB_POOL_MAX, 20), // Máximo de conexões no pool
  idleTimeoutMillis: parseNumber(process.env.DB_IDLE_TIMEOUT_MS, 30000), // Tempo máximo que uma conexão pode ficar ociosa
  connectionTimeoutMillis: parseNumber(process.env.DB_CONNECTION_TIMEOUT_MS, 10000), // Tempo máximo para estabelecer conexão
  keepAlive: true,
  keepAliveInitialDelayMillis: parseNumber(process.env.DB_KEEPALIVE_INITIAL_DELAY_MS, 10000),
  // Configurar encoding UTF-8
  client_encoding: 'UTF8',
});

const originalPoolQuery = pool.query.bind(pool);

pool.query = async (...args) => {
  const maxRetries = parseNumber(process.env.DB_QUERY_RETRIES, 1);
  let attempt = 0;

  while (true) {
    try {
      return await originalPoolQuery(...args);
    } catch (error) {
      if (attempt >= maxRetries || !isTransientConnectionError(error)) {
        throw error;
      }

      attempt += 1;
      console.warn(`⚠️ Falha transitória no PostgreSQL. Nova tentativa ${attempt}/${maxRetries}...`);
      await sleep(250 * attempt);
    }
  }
};

// Evento de erro do pool
pool.on('error', (err, client) => {
  console.error('Erro inesperado no cliente PostgreSQL:', err);
});

// Função para testar a conexão
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso!');
    console.log(`📊 Banco de dados: ${process.env.DB_NAME}`);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com PostgreSQL:', error.message);
    return false;
  }
};

const shouldLogQueries = process.env.NODE_ENV === 'development';

// Garantir UTF-8 em todas as conexões
pool.on('connect', (client) => {
  client.query("SET client_encoding = 'UTF8'", (err) => {
    if (err) console.error('Erro ao configurar client_encoding:', err);
  });
});

// Função auxiliar para executar queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    if (shouldLogQueries) {
      const duration = Date.now() - start;
      console.log('Query executada:', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Erro na query:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  testConnection,
};
