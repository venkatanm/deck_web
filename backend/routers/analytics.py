from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, and_
from pydantic import BaseModel
from typing import Any
from datetime import datetime, timezone, timedelta
from database import get_db
from models import Event, User
from auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


class TrackBody(BaseModel):
    name: str
    properties: dict[str, Any] = {}


# ── Ingest a single event (fire-and-forget from frontend) ──────────────────
@router.post("/track", status_code=204)
async def track_event(
    body: TrackBody,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    db.add(Event(user_id=user.id, name=body.name, properties=body.properties))
    await db.commit()


# ── Admin-only stats endpoint ──────────────────────────────────────────────
@router.get("/stats")
async def get_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_admin:
        raise HTTPException(403, "Admin only")

    now = datetime.now(timezone.utc)
    day_ago   = now - timedelta(days=1)
    week_ago  = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    async def scalar(q):
        return (await db.execute(text(q))).scalar() or 0

    async def rows(q):
        return (await db.execute(text(q))).fetchall()

    # ── User counts ────────────────────────────────────────────────────────
    total_users     = await scalar("SELECT COUNT(*) FROM users")
    new_users_7d    = await scalar(f"SELECT COUNT(*) FROM users WHERE created_at >= '{week_ago.isoformat()}'")
    new_users_30d   = await scalar(f"SELECT COUNT(*) FROM users WHERE created_at >= '{month_ago.isoformat()}'")

    # ── Project counts ─────────────────────────────────────────────────────
    total_projects  = await scalar("SELECT COUNT(*) FROM projects WHERE is_autosave = false")
    projects_7d     = await scalar(f"SELECT COUNT(*) FROM projects WHERE is_autosave=false AND created_at >= '{week_ago.isoformat()}'")

    # ── DAU / WAU / MAU (distinct users with an event) ────────────────────
    dau = await scalar(f"SELECT COUNT(DISTINCT user_id) FROM events WHERE created_at >= '{day_ago.isoformat()}'")
    wau = await scalar(f"SELECT COUNT(DISTINCT user_id) FROM events WHERE created_at >= '{week_ago.isoformat()}'")
    mau = await scalar(f"SELECT COUNT(DISTINCT user_id) FROM events WHERE created_at >= '{month_ago.isoformat()}'")

    # ── Event counts by name (last 30 days) ───────────────────────────────
    event_counts_rows = await rows(f"""
        SELECT name, COUNT(*) as cnt
        FROM events
        WHERE created_at >= '{month_ago.isoformat()}'
        GROUP BY name
        ORDER BY cnt DESC
        LIMIT 30
    """)
    event_counts = [{"name": r[0], "count": r[1]} for r in event_counts_rows]

    # ── Daily active users chart (last 14 days) ────────────────────────────
    dau_chart_rows = await rows(f"""
        SELECT DATE(created_at) as day, COUNT(DISTINCT user_id) as users
        FROM events
        WHERE created_at >= '{(now - timedelta(days=14)).isoformat()}'
        GROUP BY day
        ORDER BY day ASC
    """)
    dau_chart = [{"date": str(r[0]), "users": r[1]} for r in dau_chart_rows]

    # ── Daily event volume chart (last 14 days) ───────────────────────────
    events_chart_rows = await rows(f"""
        SELECT DATE(created_at) as day, COUNT(*) as events
        FROM events
        WHERE created_at >= '{(now - timedelta(days=14)).isoformat()}'
        GROUP BY day
        ORDER BY day ASC
    """)
    events_chart = [{"date": str(r[0]), "events": r[1]} for r in events_chart_rows]

    # ── Download format breakdown ─────────────────────────────────────────
    download_rows = await rows(f"""
        SELECT properties->>'format' as fmt, COUNT(*) as cnt
        FROM events
        WHERE name = 'export.download' AND created_at >= '{month_ago.isoformat()}'
        GROUP BY fmt
        ORDER BY cnt DESC
    """)
    downloads = [{"format": r[0] or "unknown", "count": r[1]} for r in download_rows]

    # ── Top users by event count (last 30 days) ───────────────────────────
    top_users_rows = await rows(f"""
        SELECT u.email, COUNT(e.id) as cnt
        FROM events e
        JOIN users u ON u.id = e.user_id
        WHERE e.created_at >= '{month_ago.isoformat()}'
        GROUP BY u.email
        ORDER BY cnt DESC
        LIMIT 10
    """)
    top_users = [{"email": r[0], "events": r[1]} for r in top_users_rows]

    # ── Save success rate (last 7 days) ───────────────────────────────────
    saves_ok  = await scalar(f"SELECT COUNT(*) FROM events WHERE name='project.saved' AND created_at >= '{week_ago.isoformat()}'")
    saves_err = await scalar(f"SELECT COUNT(*) FROM events WHERE name='project.save_failed' AND created_at >= '{week_ago.isoformat()}'")

    # ── AI usage ──────────────────────────────────────────────────────────
    ai_import_started   = await scalar(f"SELECT COUNT(*) FROM events WHERE name='ai.import_started' AND created_at >= '{month_ago.isoformat()}'")
    ai_import_completed = await scalar(f"SELECT COUNT(*) FROM events WHERE name='ai.import_completed' AND created_at >= '{month_ago.isoformat()}'")

    return {
        "users": {
            "total": total_users,
            "new_7d": new_users_7d,
            "new_30d": new_users_30d,
            "dau": dau,
            "wau": wau,
            "mau": mau,
        },
        "projects": {
            "total": total_projects,
            "created_7d": projects_7d,
        },
        "saves": {
            "ok_7d": saves_ok,
            "failed_7d": saves_err,
            "success_rate": round(saves_ok / (saves_ok + saves_err) * 100) if (saves_ok + saves_err) > 0 else None,
        },
        "ai": {
            "import_started_30d": ai_import_started,
            "import_completed_30d": ai_import_completed,
            "completion_rate": round(ai_import_completed / ai_import_started * 100) if ai_import_started > 0 else None,
        },
        "downloads": downloads,
        "event_counts": event_counts,
        "dau_chart": dau_chart,
        "events_chart": events_chart,
        "top_users": top_users,
    }
