# Script PowerShell para configurar banco de dados de teste
# Execute com: .\setup-test-db.ps1

Write-Host "🧪 Configurando banco de dados de teste..." -ForegroundColor Cyan

# Carregar variáveis do .env do backend
$envFile = Join-Path $PSScriptRoot "..\backend\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

$dbHost = $env:DB_HOST
$dbPort = $env:DB_PORT
$dbName = $env:DB_NAME
$dbUser = $env:DB_USER
$dbPassword = $env:DB_PASSWORD

Write-Host "Conectando em: ${dbHost}:${dbPort}/${dbName}" -ForegroundColor Yellow

# Executar script SQL
$sqlFile = Join-Path $PSScriptRoot "insert-test-users.sql"

$env:PGPASSWORD = $dbPassword
$psqlCommand = "psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f `"$sqlFile`""

Write-Host "Executando SQL..." -ForegroundColor Yellow
Invoke-Expression $psqlCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Usuários de teste criados com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usuários disponíveis:" -ForegroundColor Cyan
    Write-Host "  Admin: victorfiigueiredo@gmail.com / victor123" -ForegroundColor White
    Write-Host "  User:  teste@example.com / Teste123!" -ForegroundColor White
} else {
    Write-Host "❌ Erro ao criar usuários de teste" -ForegroundColor Red
    exit 1
}
