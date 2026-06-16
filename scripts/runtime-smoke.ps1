param(
  [switch]$KeepBackendRunning
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
  param(
    [string]$Name,
    [string]$WorkingDirectory,
    [string]$Command
  )

  Write-Host ""
  Write-Host "==> $Name" -ForegroundColor Cyan
  Push-Location $WorkingDirectory
  try {
    $global:LASTEXITCODE = 0
    Invoke-Expression $Command
    if ($LASTEXITCODE -ne 0) {
      throw "$Name failed with exit code $LASTEXITCODE"
    }
  }
  finally {
    Pop-Location
  }
}

function Wait-HttpOk {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 45
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
        return
      }
    }
    catch {
      Start-Sleep -Seconds 2
    }
  } while ((Get-Date) -lt $deadline)

  throw "Timed out waiting for $Url"
}

function Test-HttpOk {
  param(
    [string]$Url
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 300
  }
  catch {
    return $false
  }
}

function Test-DockerReady {
  Write-Host ""
  Write-Host "==> Docker preflight" -ForegroundColor Cyan

  $global:LASTEXITCODE = 0
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    docker version *> $null
  }
  finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  if ($LASTEXITCODE -ne 0) {
    throw "Docker Desktop is not running or the Docker daemon is unavailable. Start Docker Desktop, wait until it is ready, then rerun scripts\runtime-smoke.ps1."
  }
}

$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$backendProcess = $null

try {
  Test-DockerReady
  Invoke-Step "Start PostgreSQL" $backend "npm run db:up"
  Invoke-Step "Run migrations" $backend "npm run migration:run"
  Invoke-Step "Seed operations data" $backend "npm run seed"

  if (Test-HttpOk "http://127.0.0.1:3000/api/health") {
    Write-Host ""
    Write-Host "==> Reuse running backend" -ForegroundColor Cyan
  }
  else {
    Write-Host ""
    Write-Host "==> Start backend" -ForegroundColor Cyan
    $backendProcess = Start-Process `
      -FilePath "cmd.exe" `
      -ArgumentList "/c", "npm run start:prod" `
      -WorkingDirectory $backend `
      -WindowStyle Hidden `
      -PassThru

    Wait-HttpOk "http://127.0.0.1:3000/api/health"
  }

  Invoke-Step "Run API smoke checks" $backend "npm run smoke:api"

  Write-Host ""
  Write-Host "Runtime smoke passed." -ForegroundColor Green
}
finally {
  if ($backendProcess -and -not $backendProcess.HasExited -and -not $KeepBackendRunning) {
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
  }
}
