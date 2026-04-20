@echo off
REM Script para executar migrações de banco de dados
REM Certifique-se de ter PostgreSQL/psql instalado

echo ==========================================
echo Executando Migrações de Banco de Dados
echo ==========================================

REM Obter variáveis de banco de dados do arquivo .env
REM Se não existir, usar valores padrão
set DB_USER=postgres
set DB_PASSWORD=140119
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=point55

echo.
echo Conectando ao banco de dados...
echo Host: %DB_HOST%:%DB_PORT%
echo Database: %DB_NAME%
echo User: %DB_USER%
echo.

REM Executar migração de múltiplas categorias
echo [1/4] Criando tabela produto_categorias...
psql -v ON_ERROR_STOP=1 -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f "migracao-multiplas-categorias.sql"
if %errorlevel% neq 0 (
    echo ERRO ao criar tabela produto_categorias!
    pause
    exit /b 1
)

echo [2/4] Migrando dados de categorias...
psql -v ON_ERROR_STOP=1 -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f "migrar-dados-categorias.sql"
if %errorlevel% neq 0 (
    echo ERRO ao migrar dados!
    pause
    exit /b 1
)

echo [3/4] Adicionando coluna estoque_cores...
psql -v ON_ERROR_STOP=1 -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f "add-produtos-estoque-cores.sql"
if %errorlevel% neq 0 (
    echo ERRO ao adicionar coluna estoque_cores!
    pause
    exit /b 1
)

echo [4/4] Adicionando coluna estoque_variantes...
psql -v ON_ERROR_STOP=1 -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f "add-produtos-estoque-variantes.sql"
if %errorlevel% neq 0 (
    echo ERRO ao adicionar coluna estoque_variantes!
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Migrações completadas com sucesso!
echo ==========================================
echo.
pause
