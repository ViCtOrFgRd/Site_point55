#!/bin/bash
# Script de instalação rápida para Linux/Mac

set -e

echo "========================================"
echo "Instalação de Testes E2E com IA"
echo "========================================"
echo ""

cd e2e

echo "[1/5] Instalando dependências..."
npm install

echo ""
echo "[2/5] Instalando navegadores Playwright..."
npx playwright install --with-deps

echo ""
echo "[3/5] Criando arquivo de configuração..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Arquivo .env criado. IMPORTANTE: Edite o arquivo e adicione sua OPENAI_API_KEY!"
else
    echo "Arquivo .env já existe, mantendo configuração atual."
fi

echo ""
echo "[4/5] Verificando configuração do backend..."
cd ../backend
if [ ! -d node_modules ]; then
    echo "Instalando dependências do backend..."
    npm install
fi
cd ../e2e

echo ""
echo "[5/5] Verificando configuração do frontend..."
cd ../frontend
if [ ! -d node_modules ]; then
    echo "Instalando dependências do frontend..."
    npm install
fi
cd ../e2e

echo ""
echo "========================================"
echo "Instalação concluída com sucesso!"
echo "========================================"
echo ""
echo "PRÓXIMO PASSO:"
echo "1. Edite o arquivo e2e/.env e adicione sua OPENAI_API_KEY"
echo "2. Inicie o backend: cd backend && npm start"
echo "3. Inicie o frontend: cd frontend && npm run dev"
echo "4. Execute os testes: cd e2e && npm test"
echo ""
echo "Para ver mais opções:"
echo "  cd e2e"
echo "  npm run"
echo ""
echo "Documentação completa em e2e/README.md"
echo ""
