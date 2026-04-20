#Requires -RunAsAdministrator
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$DbPassword,

  [string]$DbName = 'point55',
  [string]$DbUser = 'point55_app',
  [string]$PostgresAdminUser = 'postgres'
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

  throw 'psql.exe nao encontrado. Verifique a instalacao do PostgreSQL.'
}

$psql = Get-PsqlPath

Write-Host "Usando psql em: $psql"
Write-Host 'Configurando usuario e banco da aplicacao...'

$createRoleAndDbSql = @"
DO
\$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DbUser') THEN
    CREATE ROLE $DbUser LOGIN PASSWORD '$DbPassword';
  ELSE
    ALTER ROLE $DbUser WITH PASSWORD '$DbPassword';
  END IF;
END
\$\$;

DO
\$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DbName') THEN
    CREATE DATABASE $DbName OWNER $DbUser;
  END IF;
END
\$\$;
"@

$grantSql = @"
GRANT ALL PRIVILEGES ON DATABASE $DbName TO $DbUser;
ALTER SCHEMA public OWNER TO $DbUser;
GRANT ALL ON SCHEMA public TO $DbUser;
"@

& $psql -U $PostgresAdminUser -d postgres -v ON_ERROR_STOP=1 -c $createRoleAndDbSql
& $psql -U $PostgresAdminUser -d $DbName -v ON_ERROR_STOP=1 -c $grantSql

Write-Host 'PostgreSQL configurado com sucesso.'
Write-Host "DB_NAME=$DbName"
Write-Host "DB_USER=$DbUser"
