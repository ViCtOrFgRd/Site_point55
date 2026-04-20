#Requires -RunAsAdministrator
[CmdletBinding()]
param(
  [string]$ProjectPath = 'C:\Site\site-de-vendas',
  [string]$BackendServiceName = 'Point55Backend',
  [string]$FrontendServiceName = 'Point55Frontend'
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

function Ensure-ServiceViaNssm {
  param(
    [string]$ServiceName,
    [string]$Application,
    [string]$Arguments,
    [string]$WorkingDirectory,
    [string]$LogDirectory
  )

  if (-not (Test-Path $LogDirectory)) {
    New-Item -ItemType Directory -Path $LogDirectory -Force | Out-Null
  }

  $nssm = Get-CmdPath -Name 'nssm'
  $exists = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

  if (-not $exists) {
    & $nssm install $ServiceName $Application $Arguments | Out-Null
  }

  & $nssm set $ServiceName AppDirectory $WorkingDirectory | Out-Null
  & $nssm set $ServiceName AppStdout (Join-Path $LogDirectory "$ServiceName-out.log") | Out-Null
  & $nssm set $ServiceName AppStderr (Join-Path $LogDirectory "$ServiceName-err.log") | Out-Null
  & $nssm set $ServiceName Start SERVICE_AUTO_START | Out-Null

  Stop-Service -Name $ServiceName -ErrorAction SilentlyContinue
  Start-Service -Name $ServiceName
}

$backendPath = Join-Path $ProjectPath 'backend'
$frontendPath = Join-Path $ProjectPath 'frontend'
$logsPath = Join-Path $ProjectPath 'logs'

if (-not (Test-Path $backendPath)) { throw "Backend nao encontrado em $backendPath" }
if (-not (Test-Path $frontendPath)) { throw "Frontend nao encontrado em $frontendPath" }

$nodePath = Get-CmdPath -Name 'node'
$npmPath = Get-CmdPath -Name 'npm'

Write-Host 'Instalando dependencias backend...'
Push-Location $backendPath
npm ci
Pop-Location

Write-Host 'Instalando dependencias frontend e gerando build...'
Push-Location $frontendPath
npm ci
npm run build
Pop-Location

Write-Host 'Registrando servico backend...'
Ensure-ServiceViaNssm -ServiceName $BackendServiceName -Application $nodePath -Arguments 'server.js' -WorkingDirectory $backendPath -LogDirectory $logsPath

Write-Host 'Registrando servico frontend...'
Ensure-ServiceViaNssm -ServiceName $FrontendServiceName -Application $npmPath -Arguments 'start -- -p 3000' -WorkingDirectory $frontendPath -LogDirectory $logsPath

Write-Host 'Servicos da aplicacao atualizados com sucesso.'
Write-Host "- Backend: $BackendServiceName"
Write-Host "- Frontend: $FrontendServiceName"
