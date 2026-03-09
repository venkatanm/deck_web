# Velox Decks — Servy Deployment (Stack Only)

Run the Velox Decks **Docker stack** (Postgres, MinIO, backend, Nginx) as a [Servy](https://servy-win.github.io/) service. Run the Doc-to-Deck pipeline as a **separate** Servy service.

---

## How It Works

| Service | What It Runs |
|---------|--------------|
| **velox-decks** | `docker compose up` (foreground) — Postgres, MinIO, backend, Nginx |
| **velox-cloudflared** | Cloudflare Tunnel — `cloudflared tunnel run velox-decks` (optional; for www/decks.datavelox.com) |
| **Doc-to-Deck** | Your separate Servy service — `python -m doc_to_deck_service` |

---

## Prerequisites

1. **Docker Desktop** — Running and configured
2. **Servy** — Installed (`winget install servy` or `choco install servy`)
3. **Built frontend** — `cd canva-editor; npm run build`

---

## Quick Setup

### 1. Generate and import Servy config

From PowerShell (run as Administrator if you want to use the CLI):

```powershell
cd C:\Users\UserAdmin\deck_web\deploy\scripts
.\setup-servy.ps1
```

This creates:
- `deploy\velox-decks-servy.json` (Docker stack)
- `deploy\velox-cloudflared-servy.json` (Cloudflare tunnel), if `cloudflared` is in your PATH

### 2. Import into Servy

**Option A — Servy GUI**

1. Open **Servy**
2. **File → Import**
3. Select `deploy\velox-decks-servy.json` → **Install** → **Start** (service: **velox-decks**)
4. (Optional) Select `deploy\velox-cloudflared-servy.json` → **Install** → **Start** (service: **velox-cloudflared**). The tunnel runs as LocalSystem and uses config in `C:\ProgramData\cloudflared\`. The setup script copies your tunnel credentials there; if you use a different tunnel ID, copy your `.json` from `%USERPROFILE%\.cloudflared\` to `C:\ProgramData\cloudflared\` and ensure `config.yml` there references it.

**Option B — Servy CLI**

```powershell
servy-cli import -config=json -path="C:\Users\UserAdmin\deck_web\deploy\velox-decks-servy.json" --install
```

Then start via Servy Manager or:

```powershell
Start-Service velox-decks
```

---

## Doc-to-Deck Pipeline (Separate Service)

Create a second Servy service for the pipeline:

- **Process Path:** `C:\Users\UserAdmin\deck_creation\.venv\Scripts\python.exe`
- **Parameters:** `-m doc_to_deck_service`
- **Startup Directory:** `C:\Users\UserAdmin\deck_creation`

---

## Custom Paths

If deck_web is in a different location:

```powershell
.\setup-servy.ps1 -DeckWebPath "D:\VeloxDecks\deck_web"
```

---

## Monitoring

- **Servy Manager** — Real-time CPU/RAM, logs, status
- **Logs** — `deploy\logs\velox-stack.log`, `velox-stack.err`
- **Health** — Servy restarts the stack if it crashes (configurable)

---

## Updating

1. Pull latest code, rebuild frontend if needed
2. Restart the service:
- Servy Manager → select velox-decks → Restart
  - Or: `Restart-Service velox-decks`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **"Unexpected error occurred"** | 1) Run Servy **as Administrator** (right‑click → Run as administrator). 2) Regenerate config: `.\setup-servy.ps1` and re-import. 3) Try the **minimal** config: import `deploy\velox-decks-servy-minimal.json` (only required fields), then set Startup type, logs, etc. in the GUI. 4) Check **Event Viewer** (Windows Logs → Application) for the real error. 5) Ensure Docker path is correct: run `where docker` and fix `ExecutablePath` in the JSON if needed. |
| Service won't start | Ensure Docker Desktop is running before starting velox-decks |
| Port 80 in use | Stop IIS or other web server |
| Stack crashes | Check `C:\ProgramData\Servy\velox-decks\velox-stack.err` |
