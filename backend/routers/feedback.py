from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime, timedelta, timezone
import uuid

from database import get_db
from models import Feedback, UserSurveyState, User
from auth import get_current_user

router = APIRouter(prefix="/api", tags=["feedback"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class FeedbackCreate(BaseModel):
    type:            str                    # 'survey' | 'button'
    survey_trigger:  Optional[str] = None
    session_id:      Optional[str] = None
    rating:          Optional[int] = None
    primary_answer:  Optional[str] = None
    follow_up_text:  Optional[str] = None
    page_context:    Optional[str] = None
    deck_id:         Optional[str] = None
    app_version:     Optional[str] = None


class SurveyStateCreate(BaseModel):
    trigger_key: str
    status:      str   # 'answered' | 'dismissed' | 'auto_dismissed'


class FeedbackAdminUpdate(BaseModel):
    is_read:     Optional[bool] = None
    is_archived: Optional[bool] = None
    admin_note:  Optional[str]  = None


# ── Sentiment computation ──────────────────────────────────────────────────────

def compute_sentiment(feedback_type: str, survey_trigger: Optional[str],
                      rating: Optional[int], text_content: Optional[str]) -> Optional[str]:
    if feedback_type == "survey" and rating is not None:
        if survey_trigger == "nps":
            if rating >= 9:  return "positive"
            if rating >= 7:  return "neutral"
            return "negative"
        else:
            if rating >= 4:  return "positive"
            if rating == 3:  return "neutral"
            return "negative"

    if feedback_type == "button" and text_content:
        t = text_content.lower()
        neg = ["bug", "broken", "crash", "slow", "wrong", "error", "issue", "problem",
               "can't", "cannot", "doesn't work", "missing", "annoying", "confusing",
               "terrible", "awful"]
        pos = ["love", "great", "amazing", "perfect", "excellent", "fast", "easy",
               "intuitive", "helpful", "fantastic"]
        neg_c = sum(1 for w in neg if w in t)
        pos_c = sum(1 for w in pos if w in t)
        if pos_c > neg_c:  return "positive"
        if neg_c > pos_c:  return "negative"
        return "neutral"

    return None


# ── Submit feedback ────────────────────────────────────────────────────────────

@router.post("/feedback", status_code=201)
async def submit_feedback(
    payload: FeedbackCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sentiment = compute_sentiment(
        payload.type,
        payload.survey_trigger,
        payload.rating,
        payload.primary_answer or payload.follow_up_text,
    )

    deck_uuid = None
    if payload.deck_id:
        try:
            deck_uuid = uuid.UUID(payload.deck_id)
        except ValueError:
            pass

    entry = Feedback(
        type           = payload.type,
        survey_trigger = payload.survey_trigger,
        user_id        = user.id,
        user_email     = user.email,
        session_id     = payload.session_id,
        rating         = payload.rating,
        primary_answer = payload.primary_answer,
        follow_up_text = payload.follow_up_text,
        sentiment      = sentiment,
        page_context   = payload.page_context,
        deck_id        = deck_uuid,
        app_version    = payload.app_version,
    )
    db.add(entry)
    await db.commit()
    return {"id": str(entry.id)}


# ── Survey state: record answered/dismissed ────────────────────────────────────

@router.post("/feedback/survey-state", status_code=201)
async def record_survey_state(
    payload: SurveyStateCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        text("""
            INSERT INTO user_survey_state (id, user_id, trigger_key, status)
            VALUES (:id, :user_id, :trigger_key, :status)
            ON CONFLICT (user_id, trigger_key) DO NOTHING
        """),
        {"id": str(uuid.uuid4()), "user_id": str(user.id),
         "trigger_key": payload.trigger_key, "status": payload.status},
    )
    await db.commit()
    return {"ok": True}


# ── Survey state: fetch for current user ──────────────────────────────────────

@router.get("/feedback/survey-state")
async def get_survey_state(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(
        text("SELECT trigger_key, status FROM user_survey_state WHERE user_id = :uid"),
        {"uid": str(user.id)},
    )).fetchall()
    return {"completed": [{"trigger": r.trigger_key, "status": r.status} for r in rows]}


# ── Admin: list feedback ───────────────────────────────────────────────────────

@router.get("/admin/feedback")
async def list_feedback(
    type:        Optional[str]  = Query(None),
    trigger:     Optional[str]  = Query(None),
    sentiment:   Optional[str]  = Query(None),
    is_read:     Optional[bool] = Query(None),
    is_archived: Optional[bool] = Query(False),
    search:      Optional[str]  = Query(None),
    date_from:   Optional[str]  = Query(None),
    date_to:     Optional[str]  = Query(None),
    page:        int            = Query(1, ge=1),
    page_size:   int            = Query(25, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_admin:
        raise HTTPException(403, "Admin only")

    conditions = []
    params: dict = {}

    if type:
        conditions.append("type = :type")
        params["type"] = type
    if trigger:
        conditions.append("survey_trigger = :trigger")
        params["trigger"] = trigger
    if sentiment:
        conditions.append("sentiment = :sentiment")
        params["sentiment"] = sentiment
    if is_read is not None:
        conditions.append("is_read = :is_read")
        params["is_read"] = is_read
    if is_archived is not None:
        conditions.append("is_archived = :is_archived")
        params["is_archived"] = is_archived
    if search:
        conditions.append(
            "(primary_answer ILIKE :search OR follow_up_text ILIKE :search OR user_email ILIKE :search)"
        )
        params["search"] = f"%{search}%"
    if date_from:
        conditions.append("created_at >= :date_from")
        params["date_from"] = date_from
    if date_to:
        conditions.append("created_at <= :date_to")
        params["date_to"] = date_to

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    offset = (page - 1) * page_size
    params["limit"] = page_size
    params["offset"] = offset

    rows = (await db.execute(
        text(f"""
            SELECT id, type, survey_trigger, user_email, session_id, rating,
                   primary_answer, follow_up_text, sentiment, page_context,
                   deck_id, app_version, created_at, is_read, is_archived, admin_note
            FROM feedback
            {where}
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """),
        params,
    )).fetchall()

    total = (await db.execute(
        text(f"SELECT COUNT(*) FROM feedback {where}"),
        {k: v for k, v in params.items() if k not in ("limit", "offset")},
    )).scalar() or 0

    return {
        "items": [dict(r._mapping) for r in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ── Admin: aggregate stats ─────────────────────────────────────────────────────

@router.get("/admin/feedback/stats")
async def feedback_stats(
    days: int = Query(30, ge=1, le=365),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_admin:
        raise HTTPException(403, "Admin only")

    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    async def scalar(q, p=None):
        return (await db.execute(text(q), p or {})).scalar() or 0

    async def rows(q, p=None):
        return (await db.execute(text(q), p or {})).fetchall()

    total   = await scalar("SELECT COUNT(*) FROM feedback WHERE created_at >= :s", {"s": since})
    unread  = await scalar("SELECT COUNT(*) FROM feedback WHERE is_read = false AND created_at >= :s", {"s": since})

    pos = await scalar("SELECT COUNT(*) FROM feedback WHERE sentiment='positive' AND created_at >= :s", {"s": since})
    neu = await scalar("SELECT COUNT(*) FROM feedback WHERE sentiment='neutral'  AND created_at >= :s", {"s": since})
    neg = await scalar("SELECT COUNT(*) FROM feedback WHERE sentiment='negative' AND created_at >= :s", {"s": since})

    survey_cnt = await scalar("SELECT COUNT(*) FROM feedback WHERE type='survey' AND created_at >= :s", {"s": since})
    button_cnt = await scalar("SELECT COUNT(*) FROM feedback WHERE type='button' AND created_at >= :s", {"s": since})

    # NPS score
    nps_rows = await rows(
        "SELECT rating FROM feedback WHERE survey_trigger='nps' AND rating IS NOT NULL AND created_at >= :s",
        {"s": since}
    )
    nps_score = None
    if nps_rows:
        ratings = [r.rating for r in nps_rows]
        promoters  = sum(1 for r in ratings if r >= 9)
        detractors = sum(1 for r in ratings if r <= 6)
        n = len(ratings)
        nps_score = round((promoters - detractors) / n * 100, 1)

    # Avg ratings per trigger
    async def avg_rating(trigger):
        v = (await db.execute(
            text("SELECT AVG(rating) FROM feedback WHERE survey_trigger=:t AND rating IS NOT NULL AND created_at >= :s"),
            {"t": trigger, "s": since},
        )).scalar()
        return round(float(v), 2) if v else None

    avg_ratings = {
        "first_export":    await avg_rating("first_export"),
        "doc_to_deck":     await avg_rating("doc_to_deck"),
        "brand_kit_save":  await avg_rating("brand_kit_save"),
    }

    # Daily volume (14 days)
    daily = await rows(
        """
        SELECT date_trunc('day', created_at AT TIME ZONE 'UTC')::date AS date, COUNT(*) AS count
        FROM feedback
        WHERE created_at >= NOW() - INTERVAL '14 days'
        GROUP BY 1 ORDER BY 1
        """
    )

    return {
        "total":        total,
        "unread":       unread,
        "by_sentiment": {"positive": pos, "neutral": neu, "negative": neg},
        "by_type":      {"survey": survey_cnt, "button": button_cnt},
        "nps_score":    nps_score,
        "avg_rating":   avg_ratings,
        "daily_volume": [{"date": str(r.date), "count": r.count} for r in daily],
    }


# ── Admin: update single entry ─────────────────────────────────────────────────

@router.patch("/admin/feedback/{feedback_id}")
async def update_feedback(
    feedback_id: str,
    payload: FeedbackAdminUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_admin:
        raise HTTPException(403, "Admin only")

    sets = []
    params: dict = {"id": feedback_id}
    if payload.is_read is not None:
        sets.append("is_read = :is_read")
        params["is_read"] = payload.is_read
    if payload.is_archived is not None:
        sets.append("is_archived = :is_archived")
        params["is_archived"] = payload.is_archived
    if payload.admin_note is not None:
        sets.append("admin_note = :admin_note")
        params["admin_note"] = payload.admin_note

    if not sets:
        return {"ok": True}

    await db.execute(
        text(f"UPDATE feedback SET {', '.join(sets)} WHERE id = :id"),
        params,
    )
    await db.commit()
    return {"ok": True}
