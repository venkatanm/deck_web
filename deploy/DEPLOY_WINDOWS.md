# Velox Decks — Windows Deployment (NSSM)

Deploy Velox Decks on Windows (e.g. W-2155, 64GB RAM) with NSSM. Resource limits cap usage at ~60% of the machine.

---

## Architecture

| Service | Port | Memory | CPU | Managed by |
|---------|------|--------|-----|------------|
| Postgres | 5432 | 8GB | 2 | Docker (VeloxDecks-Stack) |
| MinIO | 9000, 9001 | 4GB | 1 | Docker |
| Deck Web backend | 8000 | 4GB | 2 | Docker |
| Nginx | 80 | 512MB | 0.5 | Docker |
| Doc-to-Deck pipeline | 8001 | — | — | NSSM (VeloxDecks-Pipeline) |

**Total Docker:** ~16.5GB RAM, ~5.5 CPUs (adjust for your machine).

---

## Prerequisites

1. **Docker Desktop** — [docker.com](https://www.docker.com/products/docker-desktop/)
   - Enable "Use the WSL 2 based engine" if available
   - Start Docker Desktop before deploying

2. **NSSM** — Non-Sucking Service Manager
   ```powershell
   choco install nssm
   ```
   Or download from [nssm.cc/download](https://nssm.cc/download) and place `nssm.exe` in `C:\Program Files\nssm\`.

3. **Node.js** — For building the frontend (if not already installed).

---

## One-Time Setup

### 1. Build the frontend

```powershell
cd C:\Users\UserAdmin\deck_web\canva-editor
npm install
npm run build
```

Output: `canva-editor\dist\` (required for Nginx to serve the app).

### 2. Configure secrets (optional)

Edit `deploy\docker-compose.prod.yml` or use `.env` files:

- **Backend:** `JWT_SECRET` — set a strong secret (min 32 chars).
- **Postgres:** `POSTGRES_PASSWORD` — change from default.
- **MinIO:** `MINIO_ROOT_PASSWORD` — change from default.
- **deck_creation:** Ensure `.env` in deck_creation has `GEMINI_API_KEY` and any RAG/DB settings.

### 3. Install NSSM services (run as Administrator)

```powershell
cd C:\Users\UserAdmin\deck_web\deploy\scripts
.\setup-velox-services.ps1
```

If deck_web or deck_creation are elsewhere:

```powershell
.\setup-velox-services.ps1 -DeckWebPath "D:\VeloxDecks\deck_web" -DeckCreationPath "D:\VeloxDecks\deck_creation"
```

---

## Managing Services

### Start

```powershell
nssm start VeloxDecks-Stack      # Postgres, MinIO, backend, Nginx
nssm start VeloxDecks-Pipeline # Doc-to-Deck (port 8001)
```

Or use **Windows Services** (`services.msc`) — search for "VeloxDecks".

### Stop

```powershell
nssm stop VeloxDecks-Stack
nssm stop VeloxDecks-Pipeline
```

### Status

```powershell
nssm status VeloxDecks-Stack
nssm status VeloxDecks-Pipeline
```

### Logs

- **Stack:** `deploy\logs\stack.log`, `stack.err`
- **Pipeline:** `deploy\logs\pipeline.log`, `pipeline.err`

---

## Resource Limits (60% of 64GB)

Current limits in `docker-compose.prod.yml`:

| Container | Memory | CPUs |
|-----------|--------|------|
| postgres | 8G | 2 |
| minio | 4G | 1 |
| backend | 4G | 2 |
| nginx | 512M | 0.5 |

**Total:** ~16.5GB. The pipeline (deck_creation) runs outside Docker; Windows doesn't enforce per-process memory limits easily. To cap it, run deck_creation in a Docker container and add resource limits there.

To adjust limits, edit `deploy\docker-compose.prod.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 8G   # Change as needed
      cpus: '2'
```

---

## Health Checks

```powershell
# Backend
curl http://localhost:8000/api/health

# Pipeline
curl http://localhost:8001/health

# Full app (via Nginx)
curl http://localhost/
```

---

## Updating

```powershell
cd C:\Users\UserAdmin\deck_web
git pull

# Rebuild frontend if changed
cd canva-editor
npm install
npm run build

# Restart stack (rebuilds backend image if needed)
nssm stop VeloxDecks-Stack
docker compose -f deploy\docker-compose.prod.yml build --no-cache
nssm start VeloxDecks-Stack

# Restart pipeline if deck_creation changed
nssm stop VeloxDecks-Pipeline
nssm start VeloxDecks-Pipeline
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Docker not found" | Start Docker Desktop |
| "Frontend not built" | Run `npm run build` in canva-editor |
| Port 80 in use | Stop IIS or other web server, or change Nginx port in compose |
| Pipeline 400/500 | Check `deploy\logs\pipeline.err`, ensure GEMINI_API_KEY in deck_creation `.env` |
| Services won't start | Run PowerShell as Administrator; check Event Viewer |
