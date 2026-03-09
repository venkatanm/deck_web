# Starting deck_web (with deck_creation already on 8001)

You need **three** things running:

| Service | Port | Purpose |
|--------|------|---------|
| **Postgres** | 5432 | Deck Web database |
| **MinIO** | 9000, 9001 | Image/file storage |
| **Deck Web backend** | 8000 | FastAPI (auth, projects, templates, etc.) |
| **Canva-editor frontend** | 5173 | React app (proxies `/api` → 8000, `/pipeline` → 8001) |

Doc-to-deck (deck_creation) on **8001** is assumed already running.

---

## Option A — Docker for backend + DB + MinIO (simplest)

From repo root:

```powershell
docker-compose up -d
```

This starts Postgres, MinIO, the **backend** (port 8000), and Nginx (port 80). For **local dev** you usually want the Vite frontend instead of Nginx:

1. Start only the dependencies and backend:
   ```powershell
   docker-compose up -d postgres minio backend
   ```
2. Run the frontend locally:
   ```powershell
   cd canva-editor
   npm install
   npm run dev
   ```
3. Open **http://localhost:5173**. The app will proxy `/api` to the backend (8000) and `/pipeline` to deck_creation (8001).

---

## Option B — Backend and frontend on your machine (Postgres + MinIO in Docker)

### 1. Start Postgres and MinIO

```powershell
docker-compose up -d postgres minio
```

### 2. Backend `.env`

In `backend/`, create a `.env` (copy from `backend/.env.example` if present) with:

```env
DATABASE_URL=postgresql://canva:changeme_strong_password@localhost:5432/canva_db
MINIO_ENDPOINT=localhost
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=changeme_minio_password
MINIO_BUCKET=canva-images
MINIO_SECURE=false
MINIO_PUBLIC_URL=http://localhost:9000
JWT_SECRET=your_jwt_secret_at_least_32_characters_long
JWT_EXPIRE_MINUTES=10080
FRONTEND_URL=http://localhost:5173
```

### 3. Python backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000
```

Leave this terminal open.

### 4. Frontend

In a **new** terminal:

```powershell
cd canva-editor
npm install
npm run dev
```

Open **http://localhost:5173**. The editor proxies `/api` → 8000 and `/pipeline` → 8001 (your running deck_creation service).

---

## Pipeline errors (doc-to-deck)

If you see **"doc_to_deck failed: unhandled errors in a TaskGroup (1 sub-exception)"**, the failure is inside the **doc-to-deck pipeline** (port 8001), not in deck_web. To find the real cause:

1. **Run the pipeline in a terminal** so you get the full Python traceback:
   ```powershell
   # From your doc-to-deck / deck_creation project
   python -m doc_to_deck_service
   ```
   Reproduce the action (e.g. use AI Slide Assistant or Import from AI); the terminal will show the actual exception.

2. **Typical causes**
   - Missing or invalid **GEMINI_API_KEY** (or other LLM API key the pipeline uses).
   - Network or timeout errors calling the LLM.
   - An unhandled exception in one of the pipeline’s async tasks (bug or missing error handling in the pipeline code).

3. The Velox Decks UI now shows a short, friendly message plus **Details:** with the raw pipeline message for support.

---

## Quick check

- Backend: `curl http://localhost:8000/api/health` (or open in browser).
- Pipeline (deck_creation): `curl http://localhost:8001/health`.
- Frontend: http://localhost:5173
