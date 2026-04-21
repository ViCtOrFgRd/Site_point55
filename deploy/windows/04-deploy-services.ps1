#Requires -RunAsAdministrator
[CmdletBinding()]
param(
  [string]$ProjectPath,
  [string]$BackendServiceName = 'Point55Backend',
  [string]$FrontendServiceName = 'Point55Frontend'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ProjectPath)) {
  if ($PSScriptRoot) {
    # Script is in deploy\windows; project root is two levels above.
    $ProjectPath = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
  }
  else {
    $ProjectPath = (Get-Location).Path
  }
}

function Get-CmdPath {
  param([Parameter(Mandatory = $true)][string]$Name)
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $cmd) {
    throw "Comando nao encontrado: $Name"
  }
  return $cmd.Source
}

function Invoke-ExternalCommand {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter()][string[]]$ArgumentList,
    [Parameter(Mandatory = $true)][string]$FailureMessage
  )

  & $FilePath @ArgumentList
  if ($LASTEXITCODE -ne 0) {
    throw "$FailureMessage (exit code: $LASTEXITCODE)"
  }
}

function Stop-ServiceIfExists {
  param([Parameter(Mandatory = $true)][string]$ServiceName)

  $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
  if (-not $service) {
    return
  }

  if ($service.Status -ne 'Stopped') {
    Write-Host "Parando servico $ServiceName para liberar arquivos em uso..."
    Stop-Service -Name $ServiceName -ErrorAction SilentlyContinue
    $service.WaitForStatus('Stopped', (New-TimeSpan -Seconds 30))
  }
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

  & $nssm set $ServiceName Application $Application | Out-Null
  & $nssm set $ServiceName AppParameters $Arguments | Out-Null
  & $nssm set $ServiceName AppDirectory $WorkingDirectory | Out-Null
  & $nssm set $ServiceName AppStdout (Join-Path $LogDirectory "$ServiceName-out.log") | Out-Null
  & $nssm set $ServiceName AppStderr (Join-Path $LogDirectory "$ServiceName-err.log") | Out-Null
  & $nssm set $ServiceName Start SERVICE_AUTO_START | Out-Null

  $stdoutLog = Join-Path $LogDirectory "$ServiceName-out.log"
  $stderrLog = Join-Path $LogDirectory "$ServiceName-err.log"

  Stop-Service -Name $ServiceName -ErrorAction SilentlyContinue
  try {
    Start-Service -Name $ServiceName
  }
  catch {
    throw "Falha ao iniciar servico '$ServiceName'. Verifique logs: $stderrLog e $stdoutLog. Erro original: $($_.Exception.Message)"
  }
}

$backendPath = Join-Path $ProjectPath 'backend'
$frontendPath = Join-Path $ProjectPath 'frontend'
$logsPath = Join-Path $ProjectPath 'logs'

if (-not (Test-Path $backendPath)) { throw "Backend nao encontrado em $backendPath" }
if (-not (Test-Path $frontendPath)) { throw "Frontend nao encontrado em $frontendPath" }

$nodePath = Get-CmdPath -Name 'node'
$npmPath = Get-CmdPath -Name 'npm'

Stop-ServiceIfExists -ServiceName $BackendServiceName
Stop-ServiceIfExists -ServiceName $FrontendServiceName

Write-Host 'Instalando dependencias backend...'
Push-Location $backendPath
try {
  Invoke-ExternalCommand -FilePath $npmPath -ArgumentList @('ci') -FailureMessage 'Falha ao instalar dependencias do backend via npm ci'
}
finally {
  Pop-Location
}

Write-Host 'Instalando dependencias frontend e gerando build...'
Push-Location $frontendPath
try {
  Invoke-ExternalCommand -FilePath $npmPath -ArgumentList @('ci') -FailureMessage 'Falha ao instalar dependencias do frontend via npm ci'
  Invoke-ExternalCommand -FilePath $npmPath -ArgumentList @('run', 'build') -FailureMessage 'Falha ao gerar build do frontend via npm run build'
}
finally {
  Pop-Location
}

Write-Host 'Registrando servico backend...'
Ensure-ServiceViaNssm -ServiceName $BackendServiceName -Application $nodePath -Arguments 'server.js' -WorkingDirectory $backendPath -LogDirectory $logsPath

Write-Host 'Registrando servico frontend...'
Ensure-ServiceViaNssm -ServiceName $FrontendServiceName -Application $nodePath -Arguments 'node_modules/next/dist/bin/next start -p 3000' -WorkingDirectory $frontendPath -LogDirectory $logsPath

Write-Host 'Servicos da aplicacao atualizados com sucesso.'
Write-Host "- Backend: $BackendServiceName"
Write-Host "- Frontend: $FrontendServiceName"
