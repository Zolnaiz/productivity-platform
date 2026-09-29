<#
  Checks the whole system against a real database without touching the local one:
  starts a throw-away PostgreSQL container, runs the migrations, starts the API and the
  web app on 127.0.0.1 only, runs the live API and browser suites (and, with
  -IncludeMobile, the Flutter live test), then removes everything it started.

    powershell -ExecutionPolicy Bypass -File .\scripts\verify-live.ps1
#>
param(
  [switch]$IncludeMobile,
  [switch]$SkipBrowser,
  [ValidateRange(1024, 65535)][int]$DatabasePort = 55433,
  [ValidateRange(1024, 65535)][int]$ApiPort = 3300,
  [ValidateRange(1024, 65535)][int]$WebPort = 3301
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root 'backend'
$runName = 'productivity-verify-' + [guid]::NewGuid().ToString('N').Substring(0, 12)
$runDirectory = Join-Path $root "tmp\$runName"
$apiUrl = "http://127.0.0.1:$ApiPort/api"
$webUrl = "http://127.0.0.1:$WebPort"
$serverProcess = $null
$containerId = $null
$savedEnvironment = @{}

function Invoke-Check {
  param([string]$Name, [string]$Directory, [string]$Executable, [string[]]$Arguments)
  Write-Host "`n==> $Name" -ForegroundColor Cyan
  Push-Location $Directory
  try {
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE" }
  }
  finally { Pop-Location }
}

function Assert-FreePort {
  param([int]$Port)
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
  try { $listener.Start() }
  catch { throw "Port $Port is in use. Choose another verification port; existing services will not be reused." }
  finally { $listener.Stop() }
}

foreach ($command in @('docker', 'node', 'npm.cmd', 'npx.cmd')) {
  if (-not (Get-Command $command -ErrorAction SilentlyContinue)) { throw "$command is required for live verification." }
}
if ($IncludeMobile -and -not (Get-Command flutter -ErrorAction SilentlyContinue)) {
  throw 'Flutter is required when -IncludeMobile is used.'
}
if (@($DatabasePort, $ApiPort, $WebPort | Select-Object -Unique).Count -ne 3) {
  throw 'DatabasePort, ApiPort and WebPort must be different.'
}
Assert-FreePort $DatabasePort
Assert-FreePort $ApiPort
if (-not $SkipBrowser) { Assert-FreePort $WebPort }
Invoke-Check 'Docker preflight' $root 'docker' @('version', '--format', '{{.Server.Version}}')

# Every address and credential below belongs to this run. Environment values
# override dotenv, so a developer's .env cannot redirect the seed or write tests.
$testEnvironment = @{
  NODE_ENV = 'test'; PORT = "$ApiPort"; API_HOST = '127.0.0.1'
  DB_HOST = '127.0.0.1'; DB_PORT = "$DatabasePort"
  DB_USERNAME = 'productivity_test'; DB_PASSWORD = 'isolated-test-only'
  DB_DATABASE = 'productivity_verification'; DB_SSL = 'false'
  DB_SYNCHRONIZE = 'false'; DB_MIGRATIONS_RUN = 'false'; DB_LOGGING = 'false'
  JWT_SECRET = 'isolated-verification-access-secret-only'
  JWT_REFRESH_SECRET = 'isolated-verification-refresh-secret-only'
  JWT_EXPIRES_IN = '1h'; JWT_REFRESH_EXPIRES_IN = '7d'
  APP_TIME_ZONE = 'Asia/Ulaanbaatar'
  ENABLE_AUDIT_SCHEDULER = 'false'; ENABLE_MONTH_CLOSE = 'false'
  ENABLE_DAILY_REMINDERS = 'false'; ENABLE_METRICS = 'false'
  ENABLE_SWAGGER = 'false'; ALLOW_PUBLIC_OPERATIONS = 'false'
  RATE_LIMIT_LIMIT = '5000'; MAIL_TRANSPORT = 'log'
  ATTACHMENT_STORE = 'local'; UPLOAD_DIR = (Join-Path $runDirectory 'uploads')
  CORS_ORIGINS = $webUrl; FRONTEND_URL = $webUrl; APP_BASE_URL = $webUrl
  BACKEND_URL = "http://127.0.0.1:$ApiPort"
  SEED_ORGANIZATION_ID = '11111111-1111-4111-8111-000000000001'
  SEED_OWNER_ID = '22222222-2222-4222-8222-000000000001'
  SEED_OPERATOR_ID = '22222222-2222-4222-8222-000000000002'
  SEED_OWNER_EMAIL = 'owner@example.com'; SEED_OWNER_PASSWORD = 'Password123'
  SEED_OPERATOR_EMAIL = 'operator@example.com'; SEED_OPERATOR_PASSWORD = 'Password123'
  SMOKE_API_URL = $apiUrl; SMOKE_WRITES = 'true'
  SMOKE_ORGANIZATION_ID = '11111111-1111-4111-8111-000000000001'
  SMOKE_USER_EMAIL = 'owner@example.com'; SMOKE_USER_PASSWORD = 'Password123'
  SMOKE_USER_ID = '22222222-2222-4222-8222-000000000001'
  SMOKE_USER_ROLE = 'organization_admin'
  VITE_API_URL = $apiUrl
  E2E_LIVE_API = 'true'; E2E_API_URL = $apiUrl; E2E_BASE_URL = $webUrl
  E2E_WEB_PORT = "$WebPort"; E2E_REUSE_SERVER = 'false'
  E2E_EMAIL = 'owner@example.com'; E2E_OPERATOR_EMAIL = 'operator@example.com'
  E2E_PASSWORD = 'Password123'
}

try {
  New-Item -ItemType Directory -Path $runDirectory | Out-Null
  foreach ($entry in $testEnvironment.GetEnumerator()) {
    $savedEnvironment[$entry.Key] = [Environment]::GetEnvironmentVariable($entry.Key, 'Process')
    [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, 'Process')
  }

  Write-Host "`n==> Fresh PostgreSQL: $runName" -ForegroundColor Cyan
  # tmpfs and --rm leave no persistent test database or named volume behind.
  $started = & docker run --detach --rm --name $runName `
    --label "productivity.verification=$runName" `
    --publish "127.0.0.1:${DatabasePort}:5432" `
    --mount 'type=tmpfs,destination=/var/lib/postgresql/data' `
    --env POSTGRES_USER=productivity_test --env POSTGRES_PASSWORD=isolated-test-only `
    --env POSTGRES_DB=productivity_verification `
    --health-cmd 'pg_isready -U productivity_test -d productivity_verification' `
    --health-interval 1s --health-timeout 3s --health-retries 45 postgres:16
  if ($LASTEXITCODE -ne 0) { throw 'Could not start the isolated PostgreSQL container.' }
  $containerId = ($started | Select-Object -Last 1).Trim()
  if ($containerId -notmatch '^[a-f0-9]{64}$') { throw 'Docker did not return a container ID.' }
  $deadline = (Get-Date).AddSeconds(60)
  do {
    $health = & docker inspect --format '{{.State.Health.Status}}' $containerId
    if ($LASTEXITCODE -ne 0) { throw 'The test PostgreSQL container disappeared.' }
    if ($health -eq 'healthy') { break }
    if ($health -eq 'unhealthy') { throw 'Test PostgreSQL failed its health check.' }
    Start-Sleep -Seconds 1
  } while ((Get-Date) -lt $deadline)
  if ($health -ne 'healthy') { throw 'Timed out waiting for test PostgreSQL.' }

  Invoke-Check 'Build the current backend' $backend 'npm.cmd' @('run', 'build')
  Invoke-Check 'Migrate the empty database' $backend 'npm.cmd' @('run', 'migration:run')
  Invoke-Check 'Seed the test workspace' $backend 'npm.cmd' @('run', 'seed')
  $serverProcess = Start-Process -FilePath (Get-Command node).Source `
    -ArgumentList 'dist/main' -WorkingDirectory $backend -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput (Join-Path $runDirectory 'server.log') `
    -RedirectStandardError (Join-Path $runDirectory 'server-error.log')

  $ready = $false
  $deadline = (Get-Date).AddSeconds(60)
  do {
    if ($serverProcess.HasExited) { throw "The test API exited. Read $runDirectory\server-error.log" }
    try {
      $response = Invoke-WebRequest "$apiUrl/health" -UseBasicParsing -TimeoutSec 3
      $ready = $response.StatusCode -eq 200
    }
    catch { Start-Sleep -Seconds 1 }
  } while (-not $ready -and (Get-Date) -lt $deadline)
  if (-not $ready) { throw "Timed out waiting for the test API. Read $runDirectory\server.log" }

  Invoke-Check 'API reads and writes' $backend 'npm.cmd' @('run', 'smoke:api')
  if (-not $SkipBrowser) {
    Invoke-Check 'Browser tests including the live API' (Join-Path $root 'admin-web') 'npx.cmd' @('playwright', 'test', '--workers=2')
  }
  if ($IncludeMobile) {
    Invoke-Check 'Flutter client against the live API' (Join-Path $root 'mobile-flutter') 'flutter' @(
      'test', 'test/phase_one_live_backend_test.dart', "--dart-define=API_BASE_URL=$apiUrl",
      '--dart-define=MOBILE_TEST_EMAIL=owner@example.com', '--dart-define=MOBILE_TEST_PASSWORD=Password123'
    )
  }
  Write-Host "`nLive verification passed. Server logs: $runDirectory" -ForegroundColor Green
}
finally {
  if ($serverProcess -and -not $serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction Continue
    $serverProcess.WaitForExit(10000) | Out-Null
  }
  if ($containerId -and $containerId -match '^[a-f0-9]{64}$') {
    # Check ownership before removing even a disposable container.
    $labels = & docker inspect --format '{{json .Config.Labels}}' $containerId
    if ($LASTEXITCODE -eq 0 -and ($labels | ConvertFrom-Json).'productivity.verification' -eq $runName) {
      & docker stop --time 5 $containerId | Out-Null
      if ($LASTEXITCODE -ne 0) { Write-Warning "Could not stop test container $containerId." }
      else { Write-Host 'Disposable test database removed.' }
    }
  }
  foreach ($entry in $savedEnvironment.GetEnumerator()) {
    [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, 'Process')
  }
  Write-Host "Verification logs kept in $runDirectory."
}
