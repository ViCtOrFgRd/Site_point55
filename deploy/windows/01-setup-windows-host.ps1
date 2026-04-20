#Requires -RunAsAdministrator
[CmdletBinding()]
param(
  [string]$Domain = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Ensure-Chocolatey {
  if (Get-Command choco -ErrorAction SilentlyContinue) {
    return
  }

  Write-Host "Chocolatey nao encontrado. Instalando..."
  Set-ExecutionPolicy Bypass -Scope Process -Force
  [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
  Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

function Ensure-ChocoPackage {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,

    [string]$Params = ""
  )

  $isInstalled = choco list --local-only --exact $Name | Select-String -Pattern "^$Name "
  if ($isInstalled) {
    Write-Host "Pacote ja instalado: $Name"
    return
  }

  Write-Host "Instalando pacote: $Name"
  if ([string]::IsNullOrWhiteSpace($Params)) {
    choco install $Name -y --no-progress
  } else {
    choco install $Name -y --no-progress --params "$Params"
  }
}

Write-Host "[1/5] Instalando dependencias do host Windows..."
Ensure-Chocolatey
Ensure-ChocoPackage -Name git
Ensure-ChocoPackage -Name nodejs-lts
Ensure-ChocoPackage -Name postgresql16
Ensure-ChocoPackage -Name nssm
Ensure-ChocoPackage -Name caddy

Write-Host "[2/5] Configurando firewall local..."
$rules = @(
  @{ Name = 'HTTP-80-In'; Port = 80 },
  @{ Name = 'HTTPS-443-In'; Port = 443 },
  @{ Name = 'Backend-5000-Local'; Port = 5000 },
  @{ Name = 'Frontend-3000-Local'; Port = 3000 }
)

foreach ($rule in $rules) {
  if (-not (Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $rule.Name -Direction Inbound -Protocol TCP -LocalPort $rule.Port -Action Allow | Out-Null
  }
}

Write-Host "[3/5] Detectando IP publico da instancia..."
$publicIp = ""
try {
  $token = Invoke-RestMethod -Method PUT -Uri 'http://169.254.169.254/latest/api/token' -Headers @{ 'X-aws-ec2-metadata-token-ttl-seconds' = '21600' } -TimeoutSec 3
  $publicIp = Invoke-RestMethod -Method GET -Uri 'http://169.254.169.254/latest/meta-data/public-ipv4' -Headers @{ 'X-aws-ec2-metadata-token' = $token } -TimeoutSec 3
} catch {
  try {
    $publicIp = (Invoke-RestMethod -Method GET -Uri 'https://ifconfig.me/ip' -TimeoutSec 5).Trim()
  } catch {
    $publicIp = ""
  }
}

Write-Host "[4/5] Validando binarios principais..."
Get-Command node | Out-Null
Get-Command npm | Out-Null
Get-Command nssm | Out-Null
Get-Command caddy | Out-Null

Write-Host "[5/5] Checklist AWS/DNS"
Write-Host "- Security Group: liberar TCP 22, 80, 443"
Write-Host "- Elastic IP recomendado para manter IP fixo"
if ($publicIp) {
  Write-Host "IP publico detectado: $publicIp"
  if ($Domain) {
    Write-Host "DNS A esperado: $Domain -> $publicIp"
    Write-Host "DNS A esperado: www.$Domain -> $publicIp"
  }
} else {
  Write-Warning "Nao foi possivel detectar IP publico automaticamente."
}

Write-Host "Concluido. Host Windows pronto para deploy nativo."
