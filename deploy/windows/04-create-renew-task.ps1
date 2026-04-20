#Requires -RunAsAdministrator
[CmdletBinding()]
param(
  [string]$Distro = 'Ubuntu-22.04',
  [string]$ProjectPathWindows = 'C:\Site\site-de-vendas',
  [string]$TaskName = 'SiteVendas-SSL-Renew',
  [string]$RunAt = '03:00'
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

$projectPathWsl = Convert-ToWslPath -WindowsPath $ProjectPathWindows
$bashCommand = "cd '$projectPathWsl' && docker compose -f docker-compose.prod.yml run --rm certbot renew --webroot --webroot-path /var/www/certbot && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload"
$arguments = "-d $Distro -u root -- bash -lc `"$bashCommand`""

$action = New-ScheduledTaskAction -Execute 'wsl.exe' -Argument $arguments
$trigger = New-ScheduledTaskTrigger -Daily -At $RunAt
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -RunLevel Highest -LogonType ServiceAccount
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null

Write-Host "Task registrada: $TaskName"
Write-Host "Horario diario: $RunAt"
Write-Host "Comando WSL: $bashCommand"
