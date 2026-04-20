#!/usr/bin/env bash
set -euo pipefail

# Initializes database schema and applies SQL migrations with tracking.

PROJECT_DIR="${PROJECT_DIR:-$PWD}"
BACKEND_ENV_FILE="${BACKEND_ENV_FILE:-${PROJECT_DIR}/backend/.env}"

if [[ -f "${BACKEND_ENV_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${BACKEND_ENV_FILE}"
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-point55}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

SCHEMA_FILE="${PROJECT_DIR}/database/schema.sql"
MIGRATIONS_DIR="${PROJECT_DIR}/backend/migrations"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql nao encontrado. Instale PostgreSQL client antes de continuar."
  exit 1
fi

if [[ -z "${DB_PASSWORD}" ]]; then
  echo "DB_PASSWORD nao definido (nem no backend/.env nem no ambiente)."
  exit 1
fi

export PGPASSWORD="${DB_PASSWORD}"
PSQL=(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1)

echo "Testando conexao com banco..."
"${PSQL[@]}" -c "SELECT 1;" >/dev/null

echo "Criando tabela de controle de migracoes..."
"${PSQL[@]}" <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SQL

if [[ -f "${SCHEMA_FILE}" ]]; then
  TABLE_COUNT="$(${PSQL[@]} -t -A -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name <> 'schema_migrations';")"
  if [[ "${TABLE_COUNT}" == "0" ]]; then
    echo "Banco vazio detectado. Aplicando schema base: ${SCHEMA_FILE}"
    "${PSQL[@]}" -f "${SCHEMA_FILE}"
  else
    echo "Schema base ignorado: banco ja contem tabelas (${TABLE_COUNT})."
  fi
else
  echo "Aviso: schema base nao encontrado em ${SCHEMA_FILE}."
fi

if [[ ! -d "${MIGRATIONS_DIR}" ]]; then
  echo "Diretorio de migracoes nao encontrado: ${MIGRATIONS_DIR}"
  exit 1
fi

echo "Aplicando migracoes incrementais..."
shopt -s nullglob
for migration in "${MIGRATIONS_DIR}"/*.sql; do
  file_name="$(basename "${migration}")"

  already_applied="$(${PSQL[@]} -t -A -c "SELECT 1 FROM schema_migrations WHERE filename = '${file_name}' LIMIT 1;")"
  if [[ "${already_applied}" == "1" ]]; then
    echo "- [skip] ${file_name}"
    continue
  fi

  echo "- [run ] ${file_name}"
  "${PSQL[@]}" -f "${migration}"
  "${PSQL[@]}" -c "INSERT INTO schema_migrations (filename) VALUES ('${file_name}');"
done

echo "Migracoes concluidas com sucesso."
unset PGPASSWORD
