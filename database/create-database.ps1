# Script para criar o banco de dados Point55
# Execute este script antes de executar o schema.sql

Write-Host "=== Criando Banco de Dados Point55 ===" -ForegroundColor Cyan

# Solicitar credenciais do PostgreSQL
$pgUser = Read-Host "Digite o usuario do PostgreSQL (padrao: postgres)"
if ([string]::IsNullOrWhiteSpace($pgUser)) {
    $pgUser = "postgres"
}

$pgPassword = Read-Host "Digite a senha do PostgreSQL" -AsSecureString
$pgPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword))

# Configurar variavel de ambiente para senha
$env:PGPASSWORD = $pgPasswordPlain

Write-Host ""
Write-Host "Verificando se o banco 'point55' ja existe..." -ForegroundColor Yellow

# Verificar se o banco ja existe
$checkDb = psql -U $pgUser -h localhost -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='point55'"

if ($checkDb -eq "1") {
    Write-Host "O banco 'point55' ja existe!" -ForegroundColor Green
    $recreate = Read-Host "Deseja recriar o banco? (S/N)"
    
    if ($recreate -eq "S" -or $recreate -eq "s") {
        Write-Host "Removendo banco existente..." -ForegroundColor Yellow
        psql -U $pgUser -h localhost -d postgres -c "DROP DATABASE point55;"
        Write-Host "Criando novo banco..." -ForegroundColor Yellow
        psql -U $pgUser -h localhost -d postgres -c "CREATE DATABASE point55;"
    }
} else {
    Write-Host "Criando banco de dados 'point55'..." -ForegroundColor Yellow
    psql -U $pgUser -h localhost -d postgres -c "CREATE DATABASE point55;"
}

Write-Host ""
Write-Host "Executando schema SQL..." -ForegroundColor Yellow
$schemaPath = Join-Path $PSScriptRoot "schema.sql"
psql -U $pgUser -h localhost -d point55 -f $schemaPath

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Banco de dados criado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Informacoes de conexao:" -ForegroundColor Cyan
    Write-Host "  Host: localhost" -ForegroundColor White
    Write-Host "  Porta: 5432" -ForegroundColor White
    Write-Host "  Database: point55" -ForegroundColor White
    Write-Host "  Usuario: $pgUser" -ForegroundColor White
    Write-Host ""
    Write-Host "String de conexao:" -ForegroundColor Cyan
    $connString = "postgresql://" + $pgUser + ":********@localhost:5432/point55"
    Write-Host "  $connString" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Erro ao criar o banco de dados!" -ForegroundColor Red
}

# Limpar variavel de ambiente
Remove-Item Env:\PGPASSWORD

Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
