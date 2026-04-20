[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Domain,

  [Parameter(Mandatory = $true)]
  [string]$LetsencryptEmail,

  [Parameter(Mandatory = $true)]
  [string]$DbPassword,

  [string]$DbName = 'point55',
  [string]$DbUser = 'point55_app',
  [string]$DbHost = 'localhost',
  [string]$DbPort = '5432',
  [string]$Distro = 'Ubuntu-22.04',
  [string]$ProjectPathWindows = 'C:\Site\site-de-vendas',
  [string]$LinuxAppUser = 'ubuntu'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Convert-ToWslPath {
  param([string]$WindowsPath)
  $normalized = $WindowsPath -replace '\\', '/'
  if ($normalized -match '^([A-Za-z]):/(.*)$') {
    $drive = $Matches[1].ToLower()
    $rest = $Matches[2]
    return "/mnt/$drive/$rest"
  }
  throw "Caminho Windows invalido para conversao WSL: $WindowsPath"
}

function Invoke-WslRoot {
  param([string]$Command)
  wsl -d $Distro -u root -- bash -lc $Command
}

$projectPathWsl = Convert-ToWslPath -WindowsPath $ProjectPathWindows

Write-Host "Projeto no WSL: $projectPathWsl"
Write-Host "Normalizando finais de linha e permissao de execucao..."
Invoke-WslRoot "cd '$projectPathWsl' && sed -i 's/\r$//' deploy/prod/*.sh deploy/ssl/init-letsencrypt.sh && chmod +x deploy/prod/*.sh deploy/ssl/init-letsencrypt.sh"

Write-Host "[1/7] Setup Ubuntu no WSL"
Invoke-WslRoot "cd '$projectPathWsl' && APP_USER='$LinuxAppUser' bash deploy/prod/01-setup-ubuntu.sh"

Write-Host "[2/7] Checklist IP/DNS"
Invoke-WslRoot "cd '$projectPathWsl' && DOMAIN='$Domain' bash deploy/prod/02-configure-host.sh"

Write-Host "[3/7] Setup PostgreSQL"
Invoke-WslRoot "cd '$projectPathWsl' && DB_NAME='$DbName' DB_USER='$DbUser' DB_PASSWORD='$DbPassword' bash deploy/prod/03-setup-postgres.sh"

Write-Host "[4/7] Init schema + migracoes"
Invoke-WslRoot "cd '$projectPathWsl' && DB_HOST='$DbHost' DB_PORT='$DbPort' DB_NAME='$DbName' DB_USER='$DbUser' DB_PASSWORD='$DbPassword' bash deploy/prod/04-init-db.sh"

Write-Host "[5/7] Deploy app"
Invoke-WslRoot "cd '$projectPathWsl' && DOMAIN='$Domain' LETSENCRYPT_EMAIL='$LetsencryptEmail' bash deploy/prod/05-deploy-app.sh"

Write-Host "[6/7] Emitir SSL"
Invoke-WslRoot "cd '$projectPathWsl' && DOMAIN='$Domain' LETSENCRYPT_EMAIL='$LetsencryptEmail' bash deploy/prod/06-setup-ssl.sh"

Write-Host "[7/7] Cron de renovacao no Linux"
Invoke-WslRoot "cd '$projectPathWsl' && bash deploy/prod/07-setup-renew-cron.sh"

Write-Host "Deploy concluido. Validacoes sugeridas:"
Write-Host "- https://$Domain"
Write-Host "- https://$Domain/api/health"
Write-Host "- https://$Domain/api/health/database"
