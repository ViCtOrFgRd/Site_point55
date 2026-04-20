#Requires -RunAsAdministrator
[CmdletBinding()]
param(
  [string]$Domain = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "[1/4] Habilitando features para WSL2..."
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -NoRestart | Out-Null
Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -NoRestart | Out-Null

Write-Host "[2/4] Configurando firewall local (80/443)..."
$rules = @(
  @{ Name = 'HTTP-80-In'; Port = 80 },
  @{ Name = 'HTTPS-443-In'; Port = 443 }
)

foreach ($rule in $rules) {
  if (-not (Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $rule.Name -Direction Inbound -Protocol TCP -LocalPort $rule.Port -Action Allow | Out-Null
  }
}

Write-Host "[3/4] Detectando IP publico da instancia..."
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

Write-Host "[4/4] Checklist AWS/DNS"
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

Write-Host "Concluido. Se este for o primeiro setup, reinicie o servidor antes do proximo passo."
