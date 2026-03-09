# Velox Decks - Servy Service Setup
# Generates Servy configs for: 1) Docker stack, 2) Doc-to-deck pipeline.
# Both appear in Servy Manager.

param(
    [string]$DeckWebPath = "",
    [string]$DeckCreationPath = "",
    [switch]$ImportOnly,
    [switch]$StackOnly,
    [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"

# Resolve paths
$DeployPath = Split-Path $PSScriptRoot -Parent
if (-not $DeckWebPath) { $DeckWebPath = Split-Path $DeployPath -Parent }
if (-not $DeckCreationPath) { $DeckCreationPath = Join-Path (Split-Path $DeckWebPath -Parent) "deck_creation" }

$logsDir = Join-Path $DeployPath "logs"
$dockerExe = (Get-Command docker -ErrorAction SilentlyContinue).Source
if (-not $dockerExe) {
    Write-Host "Docker not found. Install Docker Desktop." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path (Join-Path $DeckWebPath "canva-editor\dist\index.html"))) {
    Write-Host "Frontend not built. Run: cd canva-editor; npm run build" -ForegroundColor Red
    exit 1
}

if (-not $OutputPath) { $OutputPath = Join-Path $DeployPath "velox-decks-servy.json" }

# Build Servy JSON config - Docker stack only (foreground)
# Logs under %ProgramData%\Servy so LocalSystem can write
$servyLogs = Join-Path $env:ProgramData "Servy\velox-decks"
$composeFile = "deploy\docker-compose.prod.yml"
$config = @{
    Name = "velox-decks"
    Description = "Velox Decks - Canva clone stack (Postgres, MinIO, backend, Nginx)"
    ExecutablePath = $dockerExe
    StartupDirectory = $DeckWebPath
    Parameters = "compose -f $composeFile up"
    StartupType = 2
    Priority = 2
    StdoutPath = (Join-Path $servyLogs "velox-stack.log")
    StderrPath = (Join-Path $servyLogs "velox-stack.err")
    StartTimeout = 60
    StopTimeout = 30
    EnableRotation = $true
    RotationSize = 10485760
    MaxRotations = 5
    EnableHealthMonitoring = $true
    HeartbeatInterval = 30
    MaxFailedChecks = 3
    RecoveryAction = 1
    MaxRestartAttempts = 5
    RunAsLocalSystem = $true
}

# No service dependency - start Docker Desktop before velox-decks

# Ensure Servy log dir exists (LocalSystem can write here)
if (-not (Test-Path $servyLogs)) { New-Item -ItemType Directory -Path $servyLogs -Force | Out-Null }

# Write JSON
$json = $config | ConvertTo-Json -Depth 10
Set-Content -Path $OutputPath -Value $json -Encoding UTF8

Write-Host "=== Velox Decks Servy Config (Stack Only) ===" -ForegroundColor Cyan
Write-Host "Config written to: $OutputPath"
Write-Host "Deck Web:   $DeckWebPath"
Write-Host ""

# --- Cloudflared tunnel Servy config (runs as LocalSystem; config in ProgramData) ---
$cloudflaredExe = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
$cloudflaredProgramData = Join-Path $env:ProgramData "cloudflared"
$cloudflaredConfigPath = Join-Path $cloudflaredProgramData "config.yml"
$cloudflaredLogs = Join-Path $env:ProgramData "Servy\velox-cloudflared"
$cloudflaredServyPath = Join-Path $DeployPath "velox-cloudflared-servy.json"
$tunnelId = "9966de43-faa0-4d0b-a750-6eb2bac9da16"
$userCreds = Join-Path $env:USERPROFILE ".cloudflared\$tunnelId.json"

if ($cloudflaredExe) {
    if (-not (Test-Path $cloudflaredLogs)) { New-Item -ItemType Directory -Path $cloudflaredLogs -Force | Out-Null }
    if (-not (Test-Path $cloudflaredProgramData)) { New-Item -ItemType Directory -Path $cloudflaredProgramData -Force | Out-Null }
    # Config that points to credentials in ProgramData (so LocalSystem can read it)
    $configContent = @"
tunnel: $tunnelId
credentials-file: $cloudflaredProgramData\$tunnelId.json

ingress:
  - hostname: www.datavelox.com
    service: http://localhost:80
  - hostname: datavelox.com
    service: http://localhost:80
  - hostname: decks.datavelox.com
    service: http://localhost:80
  - service: http_status:404
"@
    Set-Content -Path $cloudflaredConfigPath -Value $configContent -Encoding UTF8
    if (Test-Path $userCreds) {
        Copy-Item -Path $userCreds -Destination (Join-Path $cloudflaredProgramData "$tunnelId.json") -Force
        Write-Host "Copied tunnel credentials to $cloudflaredProgramData" -ForegroundColor Green
    } else {
        Write-Host "Copy tunnel credentials to $cloudflaredProgramData\$tunnelId.json (from your .cloudflared folder)" -ForegroundColor Yellow
    }
    $cfgCloudflared = @{
        Name = "velox-cloudflared"
        Description = "Cloudflare Tunnel - www.datavelox.com, decks.datavelox.com"
        ExecutablePath = $cloudflaredExe
        StartupDirectory = $cloudflaredProgramData
        Parameters = "--config `"$cloudflaredConfigPath`" tunnel run velox-decks"
        StartupType = 2
        Priority = 2
        StdoutPath = (Join-Path $cloudflaredLogs "cloudflared.log")
        StderrPath = (Join-Path $cloudflaredLogs "cloudflared.err")
        StartTimeout = 60
        StopTimeout = 15
        EnableRotation = $true
        RotationSize = 10485760
        MaxRotations = 5
        EnableHealthMonitoring = $true
        HeartbeatInterval = 30
        MaxFailedChecks = 3
        RecoveryAction = 1
        MaxRestartAttempts = 5
        RunAsLocalSystem = $true
        Deps = "velox-decks"
    }
    $cfgCloudflared | ConvertTo-Json -Depth 10 | Set-Content -Path $cloudflaredServyPath -Encoding UTF8
    Write-Host "Cloudflared tunnel config: $cloudflaredServyPath" -ForegroundColor Cyan
} else {
    Write-Host "cloudflared not in PATH; skipping velox-cloudflared-servy.json. Add cloudflared and re-run to generate." -ForegroundColor Yellow
}

Write-Host ""

if ($ImportOnly) {
    Write-Host "Use Servy GUI: File -> Import -> $OutputPath"
    if ($cloudflaredExe) { Write-Host "                 File -> Import -> $cloudflaredServyPath (tunnel)" }
    Write-Host "Or CLI: servy-cli import -config=json -path=`"$OutputPath`" --install"
    exit 0
}

# Try to import via Servy CLI if available
$servyCli = Get-Command servy-cli -ErrorAction SilentlyContinue
if ($servyCli) {
    Write-Host "Importing into Servy..."
    & servy-cli import -config=json -path=$OutputPath
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Config imported. Open Servy to Install and Start." -ForegroundColor Green
    } else {
        Write-Host "Import failed. Use Servy GUI: File -> Import -> $OutputPath" -ForegroundColor Yellow
    }
} else {
    Write-Host "Servy CLI not in PATH. Use Servy GUI:" -ForegroundColor Yellow
    Write-Host "  1. Open Servy"
    Write-Host "  2. File -> Import -> $OutputPath (stack)"
    if ($cloudflaredExe) { Write-Host "     File -> Import -> $cloudflaredServyPath (tunnel)" }
    Write-Host "  3. Click Install, then Start for each"
}
