# Velox Decks - Servy Post-Stop
# Stops Docker stack after the pipeline service has stopped.
# Called by Servy after the main process exits.

param(
    [string]$DeckWebPath = (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)
)

$ErrorActionPreference = "Stop"
$composeFile = Join-Path $DeckWebPath "deploy\docker-compose.prod.yml"

if (-not (Test-Path $composeFile)) {
    Write-Error "Compose file not found: $composeFile"
    exit 1
}

Push-Location $DeckWebPath
try {
    Write-Host "Stopping Velox Decks Docker stack..."
    docker compose -f deploy\docker-compose.prod.yml down
    Write-Host "Docker stack stopped."
} finally {
    Pop-Location
}
