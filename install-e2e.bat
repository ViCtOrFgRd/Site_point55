@echo off
REM Script de instalação rápida para Windows
echo ========================================
echo Instalacao de Testes E2E com IA
echo ========================================
echo.

cd e2e

echo [1/5] Instalando dependencias...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha ao instalar dependencias
    pause
    exit /b 1
)

echo.
echo [2/5] Instalando navegadores Playwright...
call npx playwright install
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha ao instalar navegadores
    pause
    exit /b 1
)

echo.
echo [3/5] Criando arquivo de configuracao...
if not exist .env (
    copy .env.example .env
    echo Arquivo .env criado. IMPORTANTE: Edite o arquivo e adicione sua OPENAI_API_KEY!
) else (
    echo Arquivo .env ja existe, mantendo configuracao atual.
)

echo.
echo [4/5] Verificando configuracao do backend...
cd ..\backend
if not exist node_modules (
    echo Instalando dependencias do backend...
    call npm install
)
cd ..\e2e

echo.
echo [5/5] Verificando configuracao do frontend...
cd ..\frontend
if not exist node_modules (
    echo Instalando dependencias do frontend...
    call npm install
)
cd ..\e2e

echo.
echo ========================================
echo Instalacao concluida com sucesso!
echo ========================================
echo.
echo PROXIMO PASSO:
echo 1. Edite o arquivo e2e\.env e adicione sua OPENAI_API_KEY
echo 2. Inicie o backend: cd backend ^&^& npm start
echo 3. Inicie o frontend: cd frontend ^&^& npm run dev
echo 4. Execute os testes: cd e2e ^&^& npm test
echo.
echo Para ver mais opcoes:
echo   cd e2e
echo   npm run
echo.
echo Documentacao completa em e2e\README.md
echo.
pause
