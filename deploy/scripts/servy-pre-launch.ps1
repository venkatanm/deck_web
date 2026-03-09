# Velox Decks - Servy Pre-Launch
# Starts Docker stack (postgres, minio, backend, nginx) before the pipeline service.
# Called by Servy before starting the main process.

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
    Write-Host "Starting Velox Decks Docker stack..."
    docker compose -f deploy\docker-compose.prod.yml up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker compose failed"
        exit 1
    }

    # Wait for backend to be healthy (max 60s)
    $url = "http://localhost:8000/api/health"
    $maxAttempts = 30
    $attempt = 0
    while ($attempt -lt $maxAttempts) {
        try {
            $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($r.StatusCode -eq 200) {
                Write-Host "Backend is ready."
                exit 0
            }
        } catch {
            # Ignore, retry
        }
        $attempt++
        Start-Sleep -Seconds 2
    }
    Write-Error "Backend did not become ready within 60 seconds"
    exit 1
} finally {
    Pop-Location
}
