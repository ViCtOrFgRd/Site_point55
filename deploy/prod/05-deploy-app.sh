#!/usr/bin/env bash
set -euo pipefail

# Builds and starts production app services.

PROJECT_DIR="${PROJECT_DIR:-$PWD}"
COMPOSE_FILE="${COMPOSE_FILE:-${PROJECT_DIR}/docker-compose.prod.yml}"
BACKEND_ENV_FILE="${BACKEND_ENV_FILE:-${PROJECT_DIR}/backend/.env}"

DOMAIN="${DOMAIN:-}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "Arquivo compose nao encontrado: ${COMPOSE_FILE}"
  exit 1
fi

if [[ ! -f "${BACKEND_ENV_FILE}" ]]; then
  echo "Arquivo backend/.env nao encontrado: ${BACKEND_ENV_FILE}"
  echo "Suba seus arquivos .env antes de executar este script."
  exit 1
fi

if [[ -z "${DOMAIN}" ]]; then
  echo "Defina DOMAIN antes de executar."
  echo "Exemplo: DOMAIN=seudominio.com.br bash deploy/prod/05-deploy-app.sh"
  exit 1
fi

cd "${PROJECT_DIR}"

echo "Subindo backend, frontend e nginx com build..."
export DOMAIN
if [[ -n "${LETSENCRYPT_EMAIL}" ]]; then
  export LETSENCRYPT_EMAIL
fi

docker compose -f "${COMPOSE_FILE}" up -d --build backend frontend nginx

echo "Aguardando servicos ficarem online..."
sleep 5

echo "Validando health local e HTTP publico..."
if docker compose -f "${COMPOSE_FILE}" ps | grep -q "backend"; then
  curl -fsS "http://127.0.0.1/" >/dev/null || true
  curl -fsS "http://127.0.0.1/api/health" >/dev/null || true
fi

echo "Deploy inicial concluido."
echo "Proximo passo: emitir SSL com deploy/prod/06-setup-ssl.sh"
