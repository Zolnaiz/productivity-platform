<#
.SYNOPSIS
  Brings the public deployment back after the computer restarts: Docker, the
  production stack with its backups, a Cloudflare quick tunnel, and the
  server's own idea of its public address.

.DESCRIPTION
  The pilot runs the production stack (docker-compose.prod.yml) on this
  computer and reaches the internet through a Cloudflare quick tunnel
  (docs/diploma/Uzleg2_beltgel.md, section 6). A restart stopped all of it, and
  bringing it back took six steps by hand, the last of which - copying the new
  tunnel address into .env.production - was easy to forget, and then the
  links in invitation e-mails pointed at an address that no longer existed.

  In order:
    1. Starts Docker Desktop if its engine is not answering, and waits for it.
    2. Starts the stack and the "backup" profile (database dump and attached
       files, both daily). Images are not rebuilt; run compose with --build
       after changing the code.
    3. Stops any tunnel this script started before, and starts a new one over
       HTTP/2: some networks drop the UDP that cloudflared tries first.
    4. Reads the new https://...trycloudflare.com address from the tunnel's log.
    5. Writes it to APP_BASE_URL and CORS_ORIGINS in .env.production, keeping
       every other line as it is, and recreates the backend so it reads them.
    6. Waits until the API answers through the public address, then prints it.

  A quick tunnel gets a new address every time it starts. The phone app does
  not need rebuilding for that: on its sign-in screen, Server > Change takes the
  new address. A fixed address needs a named tunnel on a Cloudflare account.

  Every run writes the address it ends with to public-url.txt at the top of
  the repository (ignored by git).

  It is safe to run again and again. When the address in public-url.txt
  still answers through the internet, the tunnel is left as it is and the run
  ends there, so the address people have does not change for nothing. That
  is what lets the scheduled task run it every 15 minutes as a watchdog: a
  quick tunnel stops for good when the computer sleeps or its network drops,
  and the next run brings it back.

.PARAMETER Notify
  For a run nobody watches - the scheduled task "Productivity Platform -
  public start", at sign-in and every 15 minutes. Everything the run prints
  goes to %TEMP%\productivity-start-public.log. A window says the new address
  when the tunnel was started again, or what went wrong and where the log is;
  a run that found everything working says nothing.

.PARAMETER NewTunnel
  Start a new tunnel even when the current address works.

.PARAMETER Hold
  For the scheduled task: do not end while the tunnel runs. Task Scheduler
  stops what a task started once the task ends - the tunnel stopped two
  seconds after the script did, and the address was gone. Held, the task
  stays running as long as the tunnel does, checking it every 5 minutes; when
  the tunnel stops, or has not answered for 15 minutes, the run ends, and the
  next 15-minute run starts a new one. While a run is holding, the task's
  next runs are skipped (MultipleInstances IgnoreNew), so there is one tunnel.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\start-public.ps1
#>
param([switch]$Notify, [switch]$NewTunnel, [switch]$Hold)
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root '.env.production'
$cloudflared = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$dockerDesktop = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
# Outside the repository, so a tunnel log is never committed by mistake.
$tunnelLog = Join-Path $env:TEMP 'productivity-tunnel.log'
$runLog = Join-Path $env:TEMP 'productivity-start-public.log'
$urlFile = Join-Path $root 'public-url.txt'

# A message box, for the unwatched run: the address is the one thing the
# person needs from it, and nothing else would tell them. It closes itself
# after ten minutes: while it waited, the task counted as running, and the
# watchdog's next runs were skipped until somebody clicked OK. The address is
# in public-url.txt either way.
function Show-Message([string]$text, [int]$icon) {
  (New-Object -ComObject WScript.Shell).Popup($text, 600, 'Productivity Platform', $icon) | Out-Null
}

# Whether an address answers /api/health through the internet right now.
function Test-PublicAddress([string]$address) {
  try { (Invoke-WebRequest -UseBasicParsing -TimeoutSec 15 "$address/api/health").StatusCode -eq 200 } catch { $false }
}

if ($Notify) {
  Start-Transcript -Path $runLog -Force | Out-Null
  # Anything that stops the run below lands here and is said, not lost in a
  # hidden window.
  trap {
    Stop-Transcript | Out-Null
    Show-Message "The system did not start:`n$($_.Exception.Message)`n`nLog: $runLog" 16
    exit 1
  }
}
$compose = @('compose', '--env-file', $envFile, '-f', (Join-Path $root 'docker-compose.prod.yml'), '-p', 'productivity-prod')

function Step($text) { Write-Host "`n== $text" -ForegroundColor Cyan }

# Polls a check until it returns something, or gives up after a while.
function Wait-Until([scriptblock]$check, [int]$seconds, [string]$what) {
  $deadline = (Get-Date).AddSeconds($seconds)
  while ((Get-Date) -lt $deadline) {
    $result = & $check
    if ($result) { return $result }
    Start-Sleep -Seconds 3
  }
  throw "Gave up waiting for $what after $seconds seconds."
}

# Starts a program through WMI, so it shares nothing with this script: no
# console, no handles. Start-Process gives the new process this console and
# every handle this one can pass on. Docker Desktop, starting, sends Ctrl+C to
# its console group as it restarts its own parts, which stopped the scheduled
# run of this script at step 1. A tunnel holding this script's output pipe
# kept whatever read that pipe waiting for ever. Both now start this way.
function Start-Detached([string]$commandLine) {
  $started = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $commandLine }
  if ($started.ReturnValue -ne 0) { throw "Could not start: $commandLine (Win32_Process.Create returned $($started.ReturnValue))." }
}

# The quick tunnels to this stack that are running: other cloudflared
# processes are never touched.
function Get-StackTunnel {
  Get-CimInstance Win32_Process -Filter "Name = 'cloudflared.exe'" |
    Where-Object { $_.CommandLine -like '*--url http://localhost:3101*' }
}

# -Hold: stays while the tunnel at $address runs and answers. Returns when it
# has stopped, or after three failed checks five minutes apart, stopping it
# then so the next run starts clean.
function Wait-WhileTunnelServes([string]$address) {
  Write-Host "Holding the tunnel at $address; checking every 5 minutes."
  $failures = 0
  while (Get-StackTunnel) {
    Start-Sleep -Seconds 300
    if (Test-PublicAddress $address) { $failures = 0; continue }
    $failures += 1
    Write-Host "$(Get-Date -Format s) $address did not answer ($failures of 3)."
    if ($failures -ge 3) {
      Get-StackTunnel | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
      break
    }
  }
  Write-Host "$(Get-Date -Format s) The tunnel stopped; the next run starts a new one."
}

function Test-DockerEngine {
  # Asked through cmd, so only the exit code comes back. docker reports a
  # stopped engine on stderr, and with ErrorActionPreference 'Stop' Windows
  # PowerShell turns a native program's stderr into a terminating error even
  # when it is redirected: `docker info *> $null` stopped this script in the
  # one case it is here to handle - Docker not running yet after a restart.
  cmd /c 'docker info >nul 2>&1'
  return $LASTEXITCODE -eq 0
}

foreach ($needed in @($envFile, $cloudflared)) {
  if (-not (Test-Path $needed)) { throw "Not found: $needed" }
}

Step '1. Docker'
if (-not (Test-DockerEngine)) {
  Start-Detached "`"$dockerDesktop`""
  Wait-Until { Test-DockerEngine } 240 'the Docker engine' | Out-Null
}
Write-Host 'Docker engine is running.'

Step '2. Production stack and backups'
& docker @compose --profile backup up -d --wait
if ($LASTEXITCODE -ne 0) { throw 'docker compose up failed.' }

Step '3. Tunnel'
$current = if (Test-Path $urlFile) { (Get-Content $urlFile -Raw).Trim() } else { '' }
if (-not $NewTunnel -and $current -and (Test-PublicAddress $current)) {
  Write-Host "Already public at $current; the tunnel is left as it is."
  # A tunnel started by hand still answers: this run takes it over, so the
  # task stays the one running process that owns it.
  if ($Hold) { Wait-WhileTunnelServes $current }
  if ($Notify) { Stop-Transcript | Out-Null }
  return
}
Get-StackTunnel | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Remove-Item $tunnelLog, "$tunnelLog.out" -ErrorAction SilentlyContinue
# cloudflared logs to stderr, where the address appears once it has one.
$tunnelArguments = 'tunnel --no-autoupdate --protocol http2 --url http://localhost:3101'
if ($Hold) {
  # Held by this run, as its own child: it lives exactly as long as the run
  # holds it. Started detached from the scheduled task instead, it was stopped
  # within a minute while the task was still running.
  Start-Process -FilePath $cloudflared -ArgumentList $tunnelArguments -WindowStyle Hidden `
    -RedirectStandardError $tunnelLog -RedirectStandardOutput "$tunnelLog.out"
} else {
  # Run by hand: detached (see Start-Detached), so it outlives this script
  # and the window it ran in.
  Start-Detached "cmd.exe /c `"`"$cloudflared`" $tunnelArguments > `"$tunnelLog.out`" 2> `"$tunnelLog`"`""
}

Step '4. Public address'
$url = Wait-Until {
  if (Test-Path $tunnelLog) {
    $found = Select-String -Path $tunnelLog -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' | Select-Object -First 1
    if ($found) { $found.Matches[0].Value }
  }
} 90 'the tunnel address'
Write-Host $url

Step '5. .env.production'
$lines = Get-Content $envFile | ForEach-Object {
  if ($_ -match '^APP_BASE_URL=') { "APP_BASE_URL=$url" }
  elseif ($_ -match '^CORS_ORIGINS=') { "CORS_ORIGINS=http://localhost:3101,$url" }
  else { $_ }
}
# UTF-8 without a byte-order mark: compose would read a BOM as part of the
# first variable's name.
[IO.File]::WriteAllLines($envFile, [string[]]$lines, (New-Object Text.UTF8Encoding $false))
& docker @compose up -d --no-build --wait backend
if ($LASTEXITCODE -ne 0) { throw 'Restarting the backend failed.' }

Step '6. Check through the internet'
Wait-Until { Test-PublicAddress $url } 120 "$url/api/health" | Out-Null

$url | Set-Content -Path $urlFile -Encoding ascii
$phoneHint = "Phone app: on the sign-in screen, Server > Change > $(([Uri]$url).Host)"
Write-Host "`nThe system is public at $url" -ForegroundColor Green
Write-Host $phoneHint
Write-Host "Tunnel log: $tunnelLog"

if ($Notify) {
  Show-Message "The system is public at`n$url`n`n$phoneHint`n`nAlso written to $urlFile" 64
}
if ($Hold) { Wait-WhileTunnelServes $url }
if ($Notify) { Stop-Transcript | Out-Null }
