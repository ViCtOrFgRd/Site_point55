@echo off
REM Script para executar migrações de banco de dados
REM Certifique-se de ter PostgreSQL/psql instalado

echo ==========================================
echo Executando Migrações de Banco de Dados
echo ==========================================

REM Obter variáveis de banco de dados do arquivo .env
REM Se não existir, usar valores padrão
set DB_USER=postgres
set DB_PASSWORD=
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=loja_vendas

echo.
echo Conectando ao banco de dados...
echo Host: %DB_HOST%:%DB_PORT%
echo Database: %DB_NAME%
echo User: %DB_USER%
echo.

REM Executar migração de múltiplas categorias
echo [1/2] Criando tabela produto_categorias...
psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f "migracao-multiplas-categorias.sql"
if %errorlevel% neq 0 (
    echo ERRO ao criar tabela produto_categorias!
    pause
    exit /b 1
)

echo [2/2] Migrando dados de categorias...
psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f "migrar-dados-categorias.sql"
if %errorlevel% neq 0 (
    echo ERRO ao migrar dados!
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Migrações completadas com sucesso!
echo ==========================================
echo.
pause
