[CmdletBinding()]
param(
  [string]$ProjectPath = 'C:\Site\site-de-vendas',
  [string]$DbHost = 'localhost',
  [string]$DbPort = '5432',
  [string]$DbName = 'point55',
  [string]$DbUser = 'point55_app',
  [Parameter(Mandatory = $true)]
  [string]$DbPassword
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-PsqlPath {
  $cmd = Get-Command psql -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }

  $candidates = Get-ChildItem 'C:\Program Files\PostgreSQL' -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    ForEach-Object { Join-Path $_.FullName 'bin\psql.exe' }

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  throw 'psql.exe nao encontrado.'
}

$schemaFile = Join-Path $ProjectPath 'database\schema.sql'
$migrationsDir = Join-Path $ProjectPath 'backend\migrations'
$psql = Get-PsqlPath

if (-not (Test-Path $schemaFile)) {
  throw "schema.sql nao encontrado em $schemaFile"
}

if (-not (Test-Path $migrationsDir)) {
  throw "Diretorio de migracoes nao encontrado em $migrationsDir"
}

$env:PGPASSWORD = $DbPassword

Write-Host 'Testando conexao...'
& $psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -c 'SELECT 1;' | Out-Null

Write-Host 'Criando tabela de controle de migracoes...'
& $psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -c @"
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"@

$tableCount = (& $psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -t -A -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name <> 'schema_migrations';").Trim()

if ($tableCount -eq '0') {
  Write-Host "Banco vazio detectado. Aplicando schema base: $schemaFile"
  & $psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -f $schemaFile
} else {
  Write-Host "Schema base ignorado: banco ja contem tabelas ($tableCount)."
}

Write-Host 'Aplicando migracoes incrementais...'
$migrationFiles = Get-ChildItem -Path $migrationsDir -Filter '*.sql' | Sort-Object Name
foreach ($file in $migrationFiles) {
  $name = $file.Name
  $alreadyApplied = (& $psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -t -A -v ON_ERROR_STOP=1 -c "SELECT 1 FROM schema_migrations WHERE filename = '$name' LIMIT 1;").Trim()

  if ($alreadyApplied -eq '1') {
    Write-Host "- [skip] $name"
    continue
  }

  Write-Host "- [run ] $name"
  & $psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -f $file.FullName
  & $psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -c "INSERT INTO schema_migrations (filename) VALUES ('$name');"
}

Write-Host 'Migracoes concluidas com sucesso.'
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
