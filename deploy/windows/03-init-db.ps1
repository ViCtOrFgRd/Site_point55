[CmdletBinding()]
param(
  [string]$ProjectPath,
  [string]$DbHost = 'localhost',
  [string]$DbPort = '5432',
  [string]$DbName = 'point55',
  [string]$DbUser = 'postgres',
  [Parameter(Mandatory = $true)]
  [SecureString]$DbPassword
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ProjectPath)) {
  $ProjectPath = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
}

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

function Invoke-Psql {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,
    [string]$Step = 'Execucao do psql'
  )

  $previousErrorActionPreference = $ErrorActionPreference
  try {
    # Native tools can write NOTICE/WARNING to stderr; do not treat that as PowerShell failure.
    $ErrorActionPreference = 'Continue'
    $output = & $psql @Arguments 2>&1 | ForEach-Object {
      if ($_ -is [System.Management.Automation.ErrorRecord]) {
        $_.ToString()
      }
      else {
        [string]$_
      }
    }
    $exitCode = $LASTEXITCODE
  }
  finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  if ($exitCode -ne 0) {
    throw "$Step falhou (exit code $exitCode):`n$($output | Out-String)"
  }

  return $output
}

$schemaFile = Join-Path $ProjectPath 'database\schema.sql'
$migrationsDir = Join-Path $ProjectPath 'backend\migrations'
$psql = Get-PsqlPath

Write-Host "Usando ProjectPath: $ProjectPath"

if (-not (Test-Path $schemaFile)) {
  throw "schema.sql nao encontrado em $schemaFile"
}

if (-not (Test-Path $migrationsDir)) {
  throw "Diretorio de migracoes nao encontrado em $migrationsDir"
}

$env:PGPASSWORD = [System.Net.NetworkCredential]::new('', $DbPassword).Password

try {
  Write-Host 'Testando conexao...'
  Invoke-Psql -Step 'Teste de conexao' -Arguments @(
    '-h', $DbHost,
    '-p', $DbPort,
    '-U', $DbUser,
    '-d', $DbName,
    '-v', 'ON_ERROR_STOP=1',
    '-c', 'SELECT 1;'
  ) | Out-Null

  Write-Host 'Criando tabela de controle de migracoes...'
  Invoke-Psql -Step 'Criacao de schema_migrations' -Arguments @(
    '-h', $DbHost,
    '-p', $DbPort,
    '-U', $DbUser,
    '-d', $DbName,
    '-v', 'ON_ERROR_STOP=1',
    '-c', @"
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"@
  ) | Out-Null

  $tableCountOutput = Invoke-Psql -Step 'Leitura de quantidade de tabelas' -Arguments @(
    '-h', $DbHost,
    '-p', $DbPort,
    '-U', $DbUser,
    '-d', $DbName,
    '-t',
    '-A',
    '-v', 'ON_ERROR_STOP=1',
    '-c', "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name <> 'schema_migrations';"
  )
  $tableCount = ($tableCountOutput | Out-String).Trim()

  if ($tableCount -eq '0') {
    Write-Host "Banco vazio detectado. Aplicando schema base: $schemaFile"
    Invoke-Psql -Step 'Aplicacao do schema base' -Arguments @(
      '-h', $DbHost,
      '-p', $DbPort,
      '-U', $DbUser,
      '-d', $DbName,
      '-v', 'ON_ERROR_STOP=1',
      '-f', $schemaFile
    ) | Out-Null
  }
  else {
    Write-Host "Schema base ignorado: banco ja contem tabelas ($tableCount)."
  }

  Write-Host 'Aplicando migracoes incrementais...'
  $migrationFiles = Get-ChildItem -Path $migrationsDir -Filter '*.sql' | Sort-Object Name
  foreach ($file in $migrationFiles) {
    $name = $file.Name
    $alreadyAppliedOutput = Invoke-Psql -Step "Leitura de status da migracao $name" -Arguments @(
      '-h', $DbHost,
      '-p', $DbPort,
      '-U', $DbUser,
      '-d', $DbName,
      '-t',
      '-A',
      '-v', 'ON_ERROR_STOP=1',
      '-c', "SELECT 1 FROM schema_migrations WHERE filename = '$name' LIMIT 1;"
    )
    $alreadyApplied = ($alreadyAppliedOutput | Out-String).Trim()

    if ($alreadyApplied -eq '1') {
      Write-Host "- [skip] $name"
      continue
    }

    Write-Host "- [run ] $name"
    Invoke-Psql -Step "Aplicacao da migracao $name" -Arguments @(
      '-h', $DbHost,
      '-p', $DbPort,
      '-U', $DbUser,
      '-d', $DbName,
      '-v', 'ON_ERROR_STOP=1',
      '-f', $file.FullName
    ) | Out-Null

    Invoke-Psql -Step "Registro da migracao $name" -Arguments @(
      '-h', $DbHost,
      '-p', $DbPort,
      '-U', $DbUser,
      '-d', $DbName,
      '-v', 'ON_ERROR_STOP=1',
      '-c', "INSERT INTO schema_migrations (filename) VALUES ('$name');"
    ) | Out-Null
  }

  Write-Host 'Migracoes concluidas com sucesso.'
}
finally {
  Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
