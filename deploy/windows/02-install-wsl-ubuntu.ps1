#Requires -RunAsAdministrator
[CmdletBinding()]
param(
  [string]$Distro = 'Ubuntu-22.04'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "Instalando WSL e distro $Distro..."

try {
  wsl --set-default-version 2 | Out-Null
} catch {
  Write-Host "WSL ainda nao inicializado. Continuando instalacao..."
}

wsl --install -d $Distro

Write-Host "Se solicitado, reinicie o servidor e execute novamente este script para confirmar a instalacao."
Write-Host "Validando distros instaladas..."
wsl --list --verbose
