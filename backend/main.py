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
from routers import projects, images, brand_kit, settings, templates

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
