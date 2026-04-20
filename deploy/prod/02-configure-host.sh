#!/usr/bin/env bash
set -euo pipefail

# Host/network checklist for EC2.
# Detects public IP and prints DNS + security reminders.

DOMAIN="${DOMAIN:-}"
PROJECT_DIR="${PROJECT_DIR:-$PWD}"

echo "Projeto: ${PROJECT_DIR}"

TOKEN="$(curl -sS -m 2 -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" || true)"
PUBLIC_IP=""

if [[ -n "${TOKEN}" ]]; then
  PUBLIC_IP="$(curl -sS -m 2 -H "X-aws-ec2-metadata-token: ${TOKEN}" "http://169.254.169.254/latest/meta-data/public-ipv4" || true)"
fi

if [[ -z "${PUBLIC_IP}" ]]; then
  PUBLIC_IP="$(curl -sS -m 4 ifconfig.me || true)"
fi

echo "IP publico detectado: ${PUBLIC_IP:-nao detectado}"

echo "\nChecklist AWS (manual):"
echo "1) Security Group: liberar inbound 22, 80, 443 (TCP)."
echo "2) EC2 com IP publico associado (Elastic IP recomendado)."
echo "3) NACL permitindo trafego de resposta."

if [[ -n "${DOMAIN}" && -n "${PUBLIC_IP}" ]]; then
  echo "\nChecklist DNS (manual no provedor de dominio):"
  echo "- Registro A: ${DOMAIN} -> ${PUBLIC_IP}"
  echo "- Registro A: www.${DOMAIN} -> ${PUBLIC_IP}"
else
  echo "\nDefina DOMAIN para gerar sugestoes DNS automaticas:"
  echo "DOMAIN=seu-dominio.com.br bash deploy/prod/02-configure-host.sh"
fi

echo "\nPortas locais em escuta (host):"
ss -tulpen | grep -E '(:22|:80|:443|:5432)' || true

echo "\nResolucao DNS atual (se DOMAIN informado):"
if [[ -n "${DOMAIN}" ]]; then
  getent hosts "${DOMAIN}" || true
  getent hosts "www.${DOMAIN}" || true
fi
