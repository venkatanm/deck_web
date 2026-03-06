# Deployment Plan — Deck Web + Doc-to-Deck on W-2155 Server

## Architecture

| Service | Port | Tech | Managed by |
|---------|------|------|------------|
| Deck Web backend (FastAPI) | 8000 | Python/uvicorn | systemd |
| Doc-to-deck pipeline service | 8001 | Python/uvicorn | systemd |
| Deck Web frontend (built static) | 80/443 | Nginx | systemd |

All services bind to `127.0.0.1` only. Nginx is the single public-facing entry point.

---

## Queue / Concurrency Decision

**Synchronous HTTP, no Redis queue.** Rationale for MVP:

- Conversions expected to complete within 30–60s
- FastAPI/uvicorn handles concurrent requests natively with async
- Redis adds infra complexity with no user-visible benefit at this scale
- Revisit if: conversions regularly exceed 60s, or concurrent user load grows

---

## One-Time Server Setup

### 1. Install system dependencies

```bash
sudo apt update && sudo apt install -y nginx python3-pip python3-venv nodejs npm git
```

### 2. Clone repos

```bash
sudo mkdir -p /opt/deck-web /opt/doc-to-deck
sudo git clone <deck-web-repo-url> /opt/deck-web
sudo git clone <doc-to-deck-repo-url> /opt/doc-to-deck
sudo chown -R $USER:$USER /opt/deck-web /opt/doc-to-deck
```

### 3. Python environments

```bash
# Deck Web backend
cd /opt/deck-web/backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# Doc-to-deck pipeline
cd /opt/doc-to-deck
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

### 4. Build frontend

```bash
cd /opt/deck-web/canva-editor
npm install
npm run build
# Output: /opt/deck-web/canva-editor/dist/
```

---

## Nginx Configuration

Create `/etc/nginx/sites-available/deck-web`:

```nginx
server {
    listen 80;
    server_name _;

    root /opt/deck-web/canva-editor/dist;
    index index.html;

    # React SPA — unknown routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Deck Web backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Doc-to-deck pipeline (strip /pipeline prefix)
    location /pipeline/ {
        rewrite ^/pipeline/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 120s;    # pipeline LLM calls can be slow
        proxy_send_timeout 120s;
        client_max_body_size 50M;   # allow large document uploads
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/deck-web /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## systemd Services

### Deck Web backend

`/etc/systemd/system/deck-web.service`:

```ini
[Unit]
Description=Deck Web API
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/deck-web/backend
ExecStart=/opt/deck-web/backend/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Doc-to-deck pipeline

`/etc/systemd/system/doc-to-deck.service`:

```ini
[Unit]
Description=Doc-to-Deck Pipeline Service
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/doc-to-deck
ExecStart=/opt/doc-to-deck/.venv/bin/uvicorn doc_to_deck_service:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start both:

```bash
sudo systemctl daemon-reload
sudo systemctl enable deck-web doc-to-deck
sudo systemctl start deck-web doc-to-deck
sudo systemctl status deck-web doc-to-deck
```

---

## Remote Access (LAN + Outside)

### LAN access
Works immediately after setup — connect via `http://<server-local-ip>`.

Find the server IP:
```bash
ip addr show | grep 'inet ' | grep -v 127.0.0.1
```

### Remote access via Tailscale (recommended for MVP)
Zero config, no port forwarding, free for personal use.

```bash
# On the server
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Note the Tailscale IP shown (e.g. 100.x.x.x)
```

Install Tailscale on any client device, sign in with the same account.
Access via `http://<tailscale-ip>` from anywhere.

---

## Deploying Updates

```bash
# Pull latest code
cd /opt/deck-web && git pull
cd /opt/doc-to-deck && git pull

# Rebuild frontend if canva-editor changed
cd /opt/deck-web/canva-editor && npm install && npm run build

# Restart services if backend changed
sudo systemctl restart deck-web
sudo systemctl restart doc-to-deck
```

---

## API Routing Summary

| Browser request | Nginx forwards to | Notes |
|----------------|-------------------|-------|
| `GET /` | `dist/index.html` | SPA entry |
| `GET /editor` | `dist/index.html` | React router handles |
| `POST /api/auth/login` | `localhost:8000/api/auth/login` | Deck Web backend |
| `POST /pipeline/api/doc-to-deck` | `localhost:8001/api/doc-to-deck` | Pipeline (prefix stripped) |
| `GET /pipeline/download/<file>` | `localhost:8001/download/<file>` | PPTX download |
| `GET /pipeline/health` | `localhost:8001/health` | Health check |

---

## Health Checks

```bash
# Backend
curl http://localhost:8000/api/health

# Pipeline
curl http://localhost:8001/health
# Expected: {"status": "ok"}

# Nginx
curl http://localhost/
```

---

## Notes

- The Vite dev proxy (`/api`, `/pipeline`) only applies during `npm run dev` — in production Nginx handles all routing, no changes to frontend code needed
- `client_max_body_size 50M` in Nginx covers large PPTX/PDF uploads; increase if needed
- Pipeline `proxy_read_timeout 120s` should cover most LLM-backed conversions; bump to `180s` if timeouts occur on large documents
- Database (PostgreSQL) for Deck Web backend should already be running; confirm connection string in backend `.env`
