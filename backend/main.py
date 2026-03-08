from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, EmailStr
import os

from database import get_db, engine, Base
from models import User, UserSettings
from auth import (
    hash_password, verify_password,
    create_token, get_current_user
)
from storage import ensure_bucket
from routers import projects, images, brand_kit, settings, templates, analytics, feedback

app = FastAPI(title="Canva Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.environ.get("FRONTEND_URL", "http://localhost:5173")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(images.router)
app.include_router(brand_kit.router)
app.include_router(settings.router)
app.include_router(templates.router)
app.include_router(analytics.router)
app.include_router(feedback.router)

@app.on_event("startup")
async def startup():
    # init.sql creates tables; create_all would conflict. Skip if tables exist.
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        if "already exists" not in str(e).lower():
            raise
    # Migration: add is_admin to users if missing (existing DBs)
    from sqlalchemy import text
    async with engine.begin() as conn:
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false"
        ))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS events (
                id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
                name       TEXT NOT NULL,
                properties JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT now()
            )
        """))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_events_name_time ON events(name, created_at DESC)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id, created_at DESC)"
        ))

        # Feedback tables
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS feedback (
                id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                type           VARCHAR(20) NOT NULL,
                survey_trigger VARCHAR(50),
                user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                user_email     VARCHAR(255),
                session_id     VARCHAR(100),
                rating         SMALLINT,
                primary_answer TEXT,
                follow_up_text TEXT,
                sentiment      VARCHAR(10),
                page_context   VARCHAR(100),
                deck_id        UUID REFERENCES projects(id) ON DELETE SET NULL,
                app_version    VARCHAR(20),
                created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                is_read        BOOLEAN NOT NULL DEFAULT FALSE,
                is_archived    BOOLEAN NOT NULL DEFAULT FALSE,
                admin_note     TEXT
            )
        """))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS user_survey_state (
                id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                trigger_key VARCHAR(50) NOT NULL,
                status      VARCHAR(20) NOT NULL,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(user_id, trigger_key)
            )
        """))
        for _idx in [
            "CREATE INDEX IF NOT EXISTS idx_feedback_user_id    ON feedback(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_feedback_type       ON feedback(type)",
            "CREATE INDEX IF NOT EXISTS idx_feedback_trigger    ON feedback(survey_trigger)",
            "CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_feedback_sentiment  ON feedback(sentiment)",
            "CREATE INDEX IF NOT EXISTS idx_feedback_unread     ON feedback(is_read) WHERE is_read = FALSE",
            "CREATE INDEX IF NOT EXISTS idx_survey_state_user   ON user_survey_state(user_id)",
        ]:
            await conn.execute(text(_idx))
    ensure_bucket()

# ── Auth endpoints ─────────────────────────────────
class RegisterBody(BaseModel):
    email: EmailStr
    password: str

@app.post("/api/auth/register")
async def register(
    body: RegisterBody,
    db: AsyncSession = Depends(get_db)
):
    try:
        existing = await db.execute(
            select(User).where(User.email == body.email)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(400, "Email already registered")
        if len(body.password) < 8:
            raise HTTPException(400, "Password must be 8+ characters")
        user = User(
            email=body.email,
            password_hash=hash_password(body.password)
        )
        db.add(user)
        await db.flush()
        db.add(UserSettings(user_id=user.id))
        await db.commit()
        return {"token": create_token(str(user.id)),
                "email": user.email, "id": str(user.id)}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(500, str(e))

@app.post("/api/auth/login")
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    # Case-insensitive email lookup
    email_lower = (form.username or "").strip().lower()
    result = await db.execute(
        select(User).where(func.lower(User.email) == email_lower)
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(form.password or "", user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    return {"access_token": create_token(str(user.id)),
            "token_type": "bearer",
            "email": user.email, "id": str(user.id)}

@app.get("/api/auth/me")
async def me(user: User = Depends(get_current_user)):
    return {"id": str(user.id), "email": user.email, "is_admin": user.is_admin}

class ResetPasswordBody(BaseModel):
    email: str
    new_password: str

@app.post("/api/auth/reset-password")
async def reset_password(
    body: ResetPasswordBody,
    db: AsyncSession = Depends(get_db)
):
    """Reset password for an email. Use if login fails due to hash migration."""
    if len(body.new_password) < 8:
        raise HTTPException(400, "Password must be 8+ characters")
    result = await db.execute(
        select(User).where(func.lower(User.email) == body.email.strip().lower())
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Email not found")
    user.password_hash = hash_password(body.new_password)
    await db.commit()
    return {"ok": True, "message": "Password reset. Try logging in."}

@app.get("/api/health")
async def health():
    return {"status": "ok"}
