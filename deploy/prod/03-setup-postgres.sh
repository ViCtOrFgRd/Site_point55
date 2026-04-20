#!/usr/bin/env bash
set -euo pipefail

# Installs PostgreSQL on Ubuntu and creates app database/user.

if [[ "${EUID}" -ne 0 ]]; then
  echo "Execute como root: sudo bash deploy/prod/03-setup-postgres.sh"
  exit 1
fi

DB_NAME="${DB_NAME:-point55}"
DB_USER="${DB_USER:-point55_app}"
DB_PASSWORD="${DB_PASSWORD:-}"
POSTGRES_VERSION="${POSTGRES_VERSION:-14}"

if [[ -z "${DB_PASSWORD}" ]]; then
  echo "Defina DB_PASSWORD antes de executar."
  echo "Exemplo: DB_PASSWORD='senha-forte' sudo -E bash deploy/prod/03-setup-postgres.sh"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y postgresql postgresql-contrib

systemctl enable postgresql
systemctl restart postgresql

# Discover installed major version dynamically when possible.
if [[ -d /etc/postgresql ]]; then
  DETECTED_VERSION="$(ls /etc/postgresql | sort -V | tail -n 1 || true)"
  if [[ -n "${DETECTED_VERSION}" ]]; then
    POSTGRES_VERSION="${DETECTED_VERSION}"
  fi
fi

PG_HBA="/etc/postgresql/${POSTGRES_VERSION}/main/pg_hba.conf"
PG_CONF="/etc/postgresql/${POSTGRES_VERSION}/main/postgresql.conf"

echo "Configurando autenticacao local para senha (scram-sha-256)..."
if [[ -f "${PG_HBA}" ]]; then
  sed -i "s/^local\s\+all\s\+all\s\+peer/local all all scram-sha-256/" "${PG_HBA}"
  sed -i "s/^host\s\+all\s\+all\s\+127.0.0.1\/32\s\+\w\+/host all all 127.0.0.1\/32 scram-sha-256/" "${PG_HBA}"
  sed -i "s/^host\s\+all\s\+all\s\+::1\/128\s\+\w\+/host all all ::1\/128 scram-sha-256/" "${PG_HBA}"
fi

if [[ -f "${PG_CONF}" ]]; then
  sed -i "s/^#*\s*listen_addresses\s*=.*/listen_addresses = 'localhost'/" "${PG_CONF}"
fi

systemctl restart postgresql

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO
\$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
SQL

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO
\$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}') THEN
    CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
  END IF;
END
\$\$;
SQL

sudo -u postgres psql -d "${DB_NAME}" -v ON_ERROR_STOP=1 <<SQL
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER SCHEMA public OWNER TO ${DB_USER};
GRANT ALL ON SCHEMA public TO ${DB_USER};
SQL

echo "PostgreSQL pronto."
echo "DB_NAME=${DB_NAME}"
echo "DB_USER=${DB_USER}"
