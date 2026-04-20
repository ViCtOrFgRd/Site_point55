#Requires -RunAsAdministrator
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Domain,

  [Parameter(Mandatory = $true)]
  [string]$AcmeEmail,

  [string]$BackendUpstream = '127.0.0.1:5000',
  [string]$FrontendUpstream = '127.0.0.1:3000',
  [string]$CaddyServiceName = 'Point55Caddy'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-CmdPath {
  param([Parameter(Mandatory = $true)][string]$Name)
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $cmd) {
    throw "Comando nao encontrado: $Name"
  }
  return $cmd.Source
}

$caddyPath = Get-CmdPath -Name 'caddy'
$nssmPath = Get-CmdPath -Name 'nssm'

$caddyRoot = 'C:\Caddy'
$caddyConfig = Join-Path $caddyRoot 'Caddyfile'
$caddyData = Join-Path $caddyRoot 'data'
$caddyConfigDir = Join-Path $caddyRoot 'config'

New-Item -ItemType Directory -Path $caddyRoot -Force | Out-Null
New-Item -ItemType Directory -Path $caddyData -Force | Out-Null
New-Item -ItemType Directory -Path $caddyConfigDir -Force | Out-Null

$caddyfileContent = @"
{
  email $AcmeEmail
}

$Domain, www.$Domain {
  encode zstd gzip

  @api path /api/* /socket.io/* /image/*
  reverse_proxy @api $BackendUpstream

  reverse_proxy $FrontendUpstream
}
"@

Set-Content -Path $caddyConfig -Value $caddyfileContent -Encoding UTF8

$existing = Get-Service -Name $CaddyServiceName -ErrorAction SilentlyContinue
if (-not $existing) {
  & $nssmPath install $CaddyServiceName $caddyPath 'run --config C:\Caddy\Caddyfile --adapter caddyfile' | Out-Null
}

& $nssmPath set $CaddyServiceName AppDirectory $caddyRoot | Out-Null
& $nssmPath set $CaddyServiceName AppEnvironmentExtra "XDG_DATA_HOME=$caddyData" "XDG_CONFIG_HOME=$caddyConfigDir" | Out-Null
& $nssmPath set $CaddyServiceName Start SERVICE_AUTO_START | Out-Null

Stop-Service -Name $CaddyServiceName -ErrorAction SilentlyContinue
Start-Service -Name $CaddyServiceName

Write-Host 'HTTPS configurado com Caddy.'
Write-Host "Servico: $CaddyServiceName"
Write-Host "Dominio: $Domain"
