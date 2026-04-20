#!/usr/bin/env bash
set -euo pipefail

# Installs a daily certbot renew cron job for dockerized certbot/nginx.

PROJECT_DIR="${PROJECT_DIR:-$PWD}"
COMPOSE_FILE="${COMPOSE_FILE:-${PROJECT_DIR}/docker-compose.prod.yml}"
CRON_SCHEDULE="${CRON_SCHEDULE:-0 3 * * *}"

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "Arquivo compose nao encontrado: ${COMPOSE_FILE}"
  exit 1
fi

JOB="cd ${PROJECT_DIR} && docker compose -f ${COMPOSE_FILE} run --rm certbot renew --webroot --webroot-path /var/www/certbot && docker compose -f ${COMPOSE_FILE} exec nginx nginx -s reload"

TMP_CRON="$(mktemp)"
crontab -l 2>/dev/null > "${TMP_CRON}" || true

if grep -Fq "certbot renew --webroot" "${TMP_CRON}"; then
  echo "Cron de renovacao ja existe. Nada a fazer."
  rm -f "${TMP_CRON}"
  exit 0
fi

echo "${CRON_SCHEDULE} ${JOB}" >> "${TMP_CRON}"
crontab "${TMP_CRON}"
rm -f "${TMP_CRON}"

echo "Cron configurado com sucesso: ${CRON_SCHEDULE}"
crontab -l | grep -F "certbot renew" || true
