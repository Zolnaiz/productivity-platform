param(
  [switch]$SkipTests
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

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
  throw "Flutter CLI is not available on PATH. Finish installing Flutter SDK, add flutter\bin to PATH, then rerun scripts\mobile-verify.ps1."
}

$root = Split-Path -Parent $PSScriptRoot
$mobile = Join-Path $root "mobile-flutter"

Invoke-Step "Flutter version" $mobile "flutter --version"
Invoke-Step "Flutter pub get" $mobile "flutter pub get"
Invoke-Step "Flutter analyze" $mobile "flutter analyze --no-fatal-infos --no-fatal-warnings"

if (-not $SkipTests) {
  if (Test-Path (Join-Path $mobile "test")) {
    Invoke-Step "Flutter tests" $mobile "flutter test"
  }
  else {
    Write-Host ""
    Write-Host "==> Flutter tests skipped: test directory not found" -ForegroundColor Yellow
  }
}
