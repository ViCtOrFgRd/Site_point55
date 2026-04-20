#!/usr/bin/env bash
set -euo pipefail

# Issues and validates Let's Encrypt certificate using existing certbot flow.

PROJECT_DIR="${PROJECT_DIR:-$PWD}"
DOMAIN="${DOMAIN:-}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"

if [[ -z "${DOMAIN}" || -z "${LETSENCRYPT_EMAIL}" ]]; then
  echo "Defina DOMAIN e LETSENCRYPT_EMAIL antes de continuar."
  echo "Exemplo: DOMAIN=seu-dominio.com.br LETSENCRYPT_EMAIL=voce@dominio.com bash deploy/prod/06-setup-ssl.sh"
  exit 1
fi

cd "${PROJECT_DIR}"

if [[ ! -f "deploy/ssl/init-letsencrypt.sh" ]]; then
  echo "Script nao encontrado: deploy/ssl/init-letsencrypt.sh"
  exit 1
fi

export DOMAIN
export LETSENCRYPT_EMAIL

sh deploy/ssl/init-letsencrypt.sh

echo "SSL emitido. Validando HTTPS..."
curl -I "https://${DOMAIN}" || true
curl -I "https://${DOMAIN}/api/health" || true

echo "Configuracao SSL concluida."
