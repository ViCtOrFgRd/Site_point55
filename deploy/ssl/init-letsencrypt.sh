#!/usr/bin/env sh
set -eu

if [ -z "${DOMAIN:-}" ] || [ -z "${LETSENCRYPT_EMAIL:-}" ]; then
  echo "Defina DOMAIN e LETSENCRYPT_EMAIL antes de emitir o certificado."
  exit 1
fi

docker compose -f docker-compose.prod.yml up -d nginx

docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email "$LETSENCRYPT_EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

docker compose -f docker-compose.prod.yml exec nginx nginx -s reload