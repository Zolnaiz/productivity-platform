param(
  [switch]$SkipAudit
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

if (-not $SkipAudit) {
  Invoke-Step "Backend audit" $backend "npm audit --audit-level=moderate"
  Invoke-Step "Frontend audit" $adminWeb "npm audit --audit-level=moderate"
}

Write-Host ""
Write-Host "All verification checks passed." -ForegroundColor Green
