#!/usr/bin/env bash
set -euo pipefail

# Base setup for Ubuntu 22.04 on EC2 t2.micro.
# Installs Docker, Compose plugin and common tools for production operations.

if [[ "${EUID}" -ne 0 ]]; then
  echo "Execute como root: sudo bash deploy/prod/01-setup-ubuntu.sh"
  exit 1
fi

APP_USER="${APP_USER:-ubuntu}"
UBUNTU_CODENAME="$(. /etc/os-release && echo "${VERSION_CODENAME}")"

export DEBIAN_FRONTEND=noninteractive

echo "[1/6] Atualizando pacotes..."
apt-get update -y
apt-get upgrade -y

echo "[2/6] Instalando dependencias basicas..."
apt-get install -y \
  ca-certificates \
  curl \
  gnupg \
  lsb-release \
  jq \
  unzip \
  net-tools \
  ufw

echo "[3/6] Configurando repositorio oficial do Docker..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${UBUNTU_CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -y

echo "[4/6] Instalando Docker Engine e Compose plugin..."
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl restart docker

echo "[5/6] Liberando Docker para usuario da aplicacao (${APP_USER})..."
if id "${APP_USER}" >/dev/null 2>&1; then
  usermod -aG docker "${APP_USER}"
  echo "Usuario ${APP_USER} adicionado ao grupo docker."
  echo "IMPORTANTE: faca logout/login para aplicar o grupo."
else
  echo "Usuario ${APP_USER} nao encontrado. Ignorando usermod."
fi

echo "[6/6] Configurando firewall local (UFW)..."
ufw allow OpenSSH || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw --force enable || true

echo "\nSetup concluido com sucesso."
docker --version
docker compose version
ufw status verbose
