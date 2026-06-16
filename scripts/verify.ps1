param(
  [switch]$SkipAudit,
  [switch]$SkipDockerConfig,
  [switch]$IncludeE2E,
  [switch]$IncludeMobile
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

$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$adminWeb = Join-Path $root "admin-web"

Invoke-Step "Backend tests" $backend "npm test -- --runInBand"
Invoke-Step "Backend lint" $backend "npm run lint:check"
Invoke-Step "Backend build" $backend "npm run build"

Invoke-Step "Frontend tests" $adminWeb "npm test -- run"
Invoke-Step "Frontend lint" $adminWeb "npm run lint:check"
Invoke-Step "Frontend build" $adminWeb "npm run build"

if (-not $SkipDockerConfig) {
  if (Get-Command docker -ErrorAction SilentlyContinue) {
    Invoke-Step "Production compose config" $root "docker compose --env-file .env.production.example -f docker-compose.prod.yml config > `$null"
    Invoke-Step "Production compose cache profile config" $root "docker compose --env-file .env.production.example -f docker-compose.prod.yml --profile cache config > `$null"
    Invoke-Step "Production compose backup profile config" $root "docker compose --env-file .env.production.example -f docker-compose.prod.yml --profile backup config > `$null"
    Invoke-Step "Production compose monitoring profile config" $root "docker compose --env-file .env.production.example -f docker-compose.prod.yml --profile monitoring config > `$null"
  }
  else {
    Write-Host ""
    Write-Host "==> Docker compose config skipped: docker CLI not found" -ForegroundColor Yellow
  }
}

if (-not $SkipAudit) {
  Invoke-Step "Backend audit" $backend "npm audit --audit-level=moderate"
  Invoke-Step "Frontend audit" $adminWeb "npm audit --audit-level=moderate"
}

if ($IncludeE2E) {
  Invoke-Step "Runtime smoke for E2E" $root "powershell -ExecutionPolicy Bypass -File .\scripts\runtime-smoke.ps1 -KeepBackendRunning"
  Invoke-Step "Frontend browser smoke" $adminWeb "npm run test:e2e"
}

if ($IncludeMobile) {
  Invoke-Step "Mobile verification" $root "powershell -ExecutionPolicy Bypass -File .\scripts\mobile-verify.ps1"
}

Write-Host ""
Write-Host "All verification checks passed." -ForegroundColor Green
