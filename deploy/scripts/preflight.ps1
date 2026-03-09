# Velox Decks - Pre-deploy checklist
# Run before setup-velox-services.ps1

$DeployPath = Split-Path $PSScriptRoot -Parent
$DeckWebPath = Split-Path $DeployPath -Parent

Write-Host "=== Velox Decks Pre-flight ===" -ForegroundColor Cyan
Write-Host ""

$ok = $true

# Docker
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "[OK] Docker installed" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Docker not found. Install Docker Desktop." -ForegroundColor Red
    $ok = $false
}

# NSSM
$nssm = "$env:ProgramFiles\nssm\nssm.exe"
if (Test-Path $nssm) {
    Write-Host "[OK] NSSM installed" -ForegroundColor Green
} else {
    Write-Host "[WARN] NSSM not found. Run: choco install nssm" -ForegroundColor Yellow
}

# Frontend build
$distIndex = Join-Path $DeckWebPath "canva-editor\dist\index.html"
if (Test-Path $distIndex) {
    Write-Host "[OK] Frontend built (canva-editor/dist)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Frontend not built. Run: cd canva-editor; npm run build" -ForegroundColor Red
    $ok = $false
}

# deck_creation
$deckCreation = Join-Path (Split-Path $DeckWebPath -Parent) "deck_creation"
$venvPython = Join-Path $deckCreation ".venv\Scripts\python.exe"
if (Test-Path $venvPython) {
    Write-Host "[OK] deck_creation found with venv" -ForegroundColor Green
} else {
    Write-Host "[WARN] deck_creation not found at $deckCreation" -ForegroundColor Yellow
}

# Port 80
$tcp80 = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue
if ($tcp80) {
    Write-Host "[WARN] Port 80 in use. Stop IIS or other web server." -ForegroundColor Yellow
} else {
    Write-Host "[OK] Port 80 available" -ForegroundColor Green
}

Write-Host ""
if ($ok) {
    Write-Host "Ready to deploy. Run as Administrator:" -ForegroundColor Green
    Write-Host "  .\setup-velox-services.ps1"
} else {
    Write-Host "Fix the issues above before deploying." -ForegroundColor Red
}
