@echo off
REM Velox Decks - Docker Compose stack runner
REM Called by NSSM. Runs in foreground so NSSM keeps the process alive.
cd /d "%~dp0..\.."
docker compose -f deploy\docker-compose.prod.yml up
