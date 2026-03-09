# Velox Decks - NSSM Service Setup
# Run as Administrator. Configures Windows services for Velox Decks.
# Prerequisites: Docker Desktop, built frontend (canva-editor/dist), deck_creation

param(
    [string]$DeckWebPath = "",
    [string]$DeckCreationPath = "",
    [string]$NssmPath = "$env:ProgramFiles\nssm\nssm.exe"
)

$ErrorActionPreference = "Stop"

# Resolve paths (default: infer from script location)
if (-not $DeckWebPath) {
    $DeployPath = Split-Path $PSScriptRoot -Parent
    $DeckWebPath = Split-Path $DeployPath -Parent
} else {
    $DeckWebPath = (Resolve-Path $DeckWebPath -ErrorAction SilentlyContinue).Path
    $DeployPath = Join-Path $DeckWebPath "deploy"
}
if (-not $DeckWebPath -or -not (Test-Path $DeckWebPath)) {
    Write-Host "Deck Web path not found. Set -DeckWebPath to your deck_web directory."
    exit 1
}
if (-not $DeployPath) { $DeployPath = Join-Path $DeckWebPath "deploy" }
if (-not $DeckCreationPath) { $DeckCreationPath = Join-Path (Split-Path $DeckWebPath -Parent) "deck_creation" }

# Check NSSM
if (-not (Test-Path $NssmPath)) {
    Write-Host "NSSM not found at $NssmPath. Install with: choco install nssm"
    Write-Host "Or download from https://nssm.cc/download and set -NssmPath"
    exit 1
}

# Check Docker
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Host "Docker not found. Install Docker Desktop and ensure it's running."
    exit 1
}

# Check frontend build
$distPath = Join-Path $DeckWebPath "canva-editor\dist"
if (-not (Test-Path (Join-Path $distPath "index.html"))) {
    Write-Host "Frontend not built. Run: cd $DeckWebPath\canva-editor; npm run build"
    exit 1
}

Write-Host "=== Velox Decks NSSM Setup ===" -ForegroundColor Cyan
Write-Host "Deck Web: $DeckWebPath"
Write-Host "Deploy:   $DeployPath"
Write-Host ""

# --- Service 1: VeloxDecks-Stack (Docker Compose) ---
$stackService = "VeloxDecks-Stack"
$composeFile = Join-Path $DeployPath "docker-compose.prod.yml"

# Batch script that docker compose runs in foreground (NSSM keeps it alive)
$stackScript = Join-Path $DeployPath "scripts\run-stack.bat"
$stackScriptContent = @"
@echo off
cd /d "$DeckWebPath"
docker compose -f deploy\docker-compose.prod.yml up
"@
Set-Content -Path $stackScript -Value $stackScriptContent -Encoding ASCII

# Remove existing service if present
& $NssmPath stop $stackService 2>$null
& $NssmPath remove $stackService confirm 2>$null

& $NssmPath install $stackService "cmd.exe" "/c `"$stackScript`""
& $NssmPath set $stackService AppDirectory $DeckWebPath
& $NssmPath set $stackService AppStdout (Join-Path $DeployPath "logs\stack.log")
& $NssmPath set $stackService AppStderr (Join-Path $DeployPath "logs\stack.err")
& $NssmPath set $stackService AppStdoutCreationDisposition 4   # Append
& $NssmPath set $stackService AppStderrCreationDisposition 4
& $NssmPath set $stackService AppRotateFiles 1
& $NssmPath set $stackService AppRotateBytes 10485760        # 10MB
& $NssmPath set $stackService Description "Velox Decks - Postgres, MinIO, Backend, Nginx"
& $NssmPath set $stackService Start SERVICE_AUTO_START

Write-Host "[OK] $stackService installed" -ForegroundColor Green

# --- Service 2: VeloxDecks-Pipeline (deck_creation) ---
$pipelineService = "VeloxDecks-Pipeline"
$venvPython = Join-Path $DeckCreationPath ".venv\Scripts\python.exe"

if (Test-Path $venvPython) {
    & $NssmPath stop $pipelineService 2>$null
    & $NssmPath remove $pipelineService confirm 2>$null

    & $NssmPath install $pipelineService $venvPython "-m doc_to_deck_service"
    & $NssmPath set $pipelineService AppDirectory $DeckCreationPath
    & $NssmPath set $pipelineService AppStdout (Join-Path $DeployPath "logs\pipeline.log")
    & $NssmPath set $pipelineService AppStderr (Join-Path $DeployPath "logs\pipeline.err")
    & $NssmPath set $pipelineService AppStdoutCreationDisposition 4
    & $NssmPath set $pipelineService AppStderrCreationDisposition 4
    & $NssmPath set $pipelineService AppRotateFiles 1
    & $NssmPath set $pipelineService AppRotateBytes 10485760
    & $NssmPath set $pipelineService Description "Velox Decks - Doc-to-Deck Pipeline (port 8001)"
    & $NssmPath set $pipelineService Start SERVICE_AUTO_START

    # Environment for pipeline (GEMINI_API_KEY etc.) - set via deck_creation .env or NSSM
    # & $NssmPath set $pipelineService AppEnvironmentExtra "GEMINI_API_KEY=your_key"

    Write-Host "[OK] $pipelineService installed" -ForegroundColor Green
} else {
    Write-Host "[SKIP] $pipelineService - deck_creation not found at $DeckCreationPath" -ForegroundColor Yellow
    Write-Host "      Install manually with: nssm install VeloxDecks-Pipeline <path-to-python> -m doc_to_deck_service"
}

# Create logs dir
$logsDir = Join-Path $DeployPath "logs"
if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir | Out-Null }

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
Write-Host "Start services:  nssm start VeloxDecks-Stack"
Write-Host "                 nssm start VeloxDecks-Pipeline"
Write-Host "Stop services:   nssm stop VeloxDecks-Stack"
Write-Host "                 nssm stop VeloxDecks-Pipeline"
Write-Host "Status:          nssm status VeloxDecks-Stack"
Write-Host ""
Write-Host "Or use Windows Services (services.msc) - search for VeloxDecks"
