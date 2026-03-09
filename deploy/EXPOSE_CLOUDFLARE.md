# Exposing Velox Decks with a Cloudflare Domain (Home Server)

This guide gets your Velox Decks app (running on a Windows server at home) reachable at a domain you manage in **Cloudflare**, with HTTPS and without opening your home IP to direct abuse.

You can do it in two ways:

| Approach | Pros | Cons |
|----------|------|------|
| **A. Cloudflare Proxy + port forward** | Simple, full control at home | You open port 80 (and optionally 443) on your router |
| **B. Cloudflare Tunnel (recommended)** | No port forwarding; works behind any NAT; Cloudflare hides your home IP | One extra service (cloudflared) to run |

---

## Prerequisites

- Velox Decks stack running (e.g. via Servy + Docker as in [DEPLOY_SERVY.md](DEPLOY_SERVY.md)).
- A **domain** whose DNS is managed in Cloudflare (e.g. `yourdomain.com`).
- You’ll use a **subdomain** for the app (e.g. `app.yourdomain.com` or `decks.yourdomain.com`).

---

## Step 0: Set the app’s public URL (both approaches)

The backend uses `FRONTEND_URL` for CORS, cookies, and redirects. It must match the **app** URL (where users log in and use the editor).

**For datavelox.com:** `www.datavelox.com` and `datavelox.com` → marketing; `decks.datavelox.com` → app.

1. Create or edit `deploy/.env`:

   ```env
   FRONTEND_URL=https://decks.datavelox.com
   ```

2. For the frontend build, set `VITE_APP_URL` in `canva-editor/.env.production`: `VITE_APP_URL=https://decks.datavelox.com`. Then rebuild: `cd canva-editor && npm run build`.

3. Run compose from `deploy/` with the env file:

   ```powershell
   cd C:\Users\UserAdmin\deck_web\deploy
   docker compose -f docker-compose.prod.yml --env-file .env up -d
   ```

   If you use Servy, ensure `.env` is in `deploy/` so the same value is used.

---

## Approach A: Cloudflare Proxy + Port Forward

Traffic: **User → Cloudflare (HTTPS) → Your home IP:80 (HTTP)**. Cloudflare terminates HTTPS; your server stays on HTTP.

### 1. Know your home’s public IP

- Visit [https://whatismyip.com](https://whatismyip.com) (or similar) from a device on your home network.
- If your ISP gives you a **dynamic** IP, use **Step 2 (Dynamic DNS)** so the domain always points to the current IP.

### 2. Dynamic DNS (if your home IP changes)

Cloudflare can hold an **A** record that you update from home:

1. In **Cloudflare Dashboard** → your zone → **DNS** → create an **A** record:
   - Name: `app` (or whatever subdomain you want, e.g. `decks`).
   - IPv4: your **current** home public IP.
   - Proxy: **Proxied** (orange cloud).
   - TTL: Auto.

2. Update that A record when your IP changes. Options:
   - **Cloudflare API** with a script/task that runs on your server (e.g. every 5 minutes):  
     `GET https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records?type=A&name=app.yourdomain.com` and PATCH the record with the new IP. Use an API token with “Edit zone DNS” permission.
   - A **DDNS client** that supports Cloudflare (e.g. [ddns-updater](https://github.com/qdm12/ddns-updater), or a small script using the Cloudflare API).

After this, `app.yourdomain.com` will always resolve to your current home IP (through Cloudflare when proxied).

### 3. Port forwarding on your router

Forward **TCP port 80** from the internet to the **Windows server’s LAN IP** (the machine running Docker), port **80**.

- In the router’s admin UI, add a rule: External port 80 → Internal IP (e.g. `192.168.1.10`) → Internal port 80.
- If you later add HTTPS at home (Approach A with Full SSL), also forward **443**.

Your Nginx container already exposes `80:80`; ensure the host firewall (Windows Defender Firewall) allows inbound TCP 80 (and 443 if used) to the host.

### 4. Cloudflare SSL mode

In Cloudflare: **SSL/TLS** → Overview:

- Set encryption mode to **Flexible** if your server only listens on HTTP (port 80).  
  Then: Browser → **HTTPS** (Cloudflare) → **HTTP** (your server). No certificate on the server needed.
- For **Full** or **Full (Strict)**, your server must serve HTTPS on 443; we don’t cover that here.

### 5. Test

- Open `https://app.yourdomain.com`. You should see Velox Decks; login and API should work if `FRONTEND_URL` is set correctly.

---

## Approach B: Cloudflare Tunnel (no port forward)

A small daemon (**cloudflared**) on your server creates an outbound tunnel to Cloudflare. Cloudflare then sends traffic through that tunnel to your app. You **don’t** open ports 80/443 on your router.

### 1. Install cloudflared on the Windows server

- Download from [https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) (e.g. Windows amd64).
- Or with winget: `winget install Cloudflare.cloudflared` (if available).
- Put `cloudflared.exe` in a fixed path (e.g. `C:\cloudflared\`).

### 2. Log in and create a tunnel

In PowerShell (as a user with access to your Cloudflare account):

```powershell
cd C:\cloudflared
.\cloudflared.exe tunnel login
```

A browser window opens; pick the zone (e.g. `yourdomain.com`). This saves a cert for your account.

Create a named tunnel and a config file:

```powershell
.\cloudflared.exe tunnel create velox-decks
```

This creates a tunnel and prints its ID. Then:

```powershell
.\cloudflared.exe tunnel list
```

Note the tunnel **ID** (e.g. `abc123-def456-...`).

### 3. Route the subdomain to the tunnel

Create a config file, e.g. `C:\cloudflared\config.yml`:

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: C:\Users\<YourUser>\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: app.yourdomain.com
    service: http://localhost:80
  - service: http_status:404
```

Replace:

- `<YOUR_TUNNEL_ID>` with the ID from `tunnel list`.
- `C:\Users\<YourUser>\.cloudflared\` with the path where `tunnel login` and `tunnel create` wrote the credentials (the `.json` file name is the tunnel ID).
- `app.yourdomain.com` with your chosen subdomain.

Route DNS in Cloudflare. For **datavelox.com** (www + apex + app):

```powershell
cloudflared tunnel route dns velox-decks www.datavelox.com
cloudflared tunnel route dns velox-decks datavelox.com
cloudflared tunnel route dns velox-decks decks.datavelox.com
```

This creates CNAMEs pointing at the tunnel. Use `deploy/cloudflared-config.yml` as the config template.

### 4. Run the tunnel

**One-off (test):**

```powershell
.\cloudflared.exe tunnel run velox-decks
```

**As a Windows service (recommended):**

```powershell
.\cloudflared.exe service install
```

Then configure the service to use your config. For example:

```powershell
# If you use a config file
.\cloudflared.exe service install --config C:\cloudflared\config.yml
```

Start the service:

```powershell
Start-Service cloudflared
```

(Exact service name may be `Cloudflare Tunnel` or similar; check `Get-Service *cloudflare*`.)

### 5. Cloudflare SSL

With a tunnel, Cloudflare talks to cloudflared over a secure channel. In **SSL/TLS**, **Full** or **Full (Strict)** is typical; the “connection” to your origin is the tunnel, not public HTTP. Your Nginx can stay on HTTP (port 80) because only cloudflared talks to it on localhost.

### 6. Test

Open `https://app.yourdomain.com`. You should see Velox Decks without any port forwarding on your router.

---

## Pipeline (doc-to-deck) on 8001

Your Nginx proxies `/pipeline/` to `host.docker.internal:8001`. That works when the **browser** sends requests to `https://app.yourdomain.com/pipeline/...`; Nginx on the same host receives them and forwards to 8001.

So:

- With **Approach A**: As long as Nginx runs on the same machine that has the pipeline on 8001, no change needed.
- With **Approach B**: cloudflared sends traffic to `http://localhost:80`; Nginx listens there and proxies `/pipeline/` to `host.docker.internal:8001`. Again, no extra steps if the pipeline is on the same host.

Ensure the doc-to-deck service is running (e.g. separate Servy service) and that nothing blocks localhost:8001 from Nginx.

---

## Security checklist

- [ ] **FRONTEND_URL** set to `https://app.yourdomain.com` (or your real URL).
- [ ] **JWT_SECRET** and **POSTGRES_PASSWORD** (and MinIO, etc.) are strong and not default in production.
- [ ] Cloudflare **Proxy** enabled (orange cloud) on the A/CNAME so traffic goes through Cloudflare (DDoS protection, optional WAF).
- [ ] If you use **port forwarding**, router admin and Windows firewall are locked down; only 80 (and 443 if used) are open as needed.
- [ ] Prefer **Cloudflare Tunnel** if you want to avoid opening ports and hide your home IP.

---

## Quick reference

| Item | Value |
|------|--------|
| App URL | `https://app.yourdomain.com` (or your subdomain) |
| Nginx (host) | Port 80 (and 443 if you add TLS at home) |
| Backend env | `FRONTEND_URL=https://app.yourdomain.com` |
| Pipeline | Same host, port 8001; Nginx proxies `/pipeline/` |

If something doesn’t load, check: Cloudflare DNS (A or CNAME), tunnel status (if using B), port forward (if using A), and backend logs for CORS/auth errors tied to `FRONTEND_URL`.
