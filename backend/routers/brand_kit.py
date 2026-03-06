from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Any
from database import get_db
from models import BrandKit
from auth import get_current_user, User

router = APIRouter(prefix="/api/brand-kit", tags=["brand-kit"])

class BrandKitSave(BaseModel):
    colors: list[Any] = []
    fonts: list[Any] = []
    logo_urls: list[Any] = []

@router.get("")
async def get_brand_kit(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(BrandKit).where(BrandKit.user_id == user.id)
    )
    kit = result.scalar_one_or_none()
    if not kit:
        return {"colors": [], "fonts": [], "logo_urls": []}
    return {
        "colors": kit.colors,
        "fonts": kit.fonts,
        "logo_urls": kit.logo_urls,
    }

@router.put("")
async def save_brand_kit(
    body: BrandKitSave,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(BrandKit).where(BrandKit.user_id == user.id)
    )
    kit = result.scalar_one_or_none()
    if kit:
        kit.colors    = body.colors
        kit.fonts     = body.fonts
        kit.logo_urls = body.logo_urls
    else:
        kit = BrandKit(
            user_id=user.id,
            colors=body.colors,
            fonts=body.fonts,
            logo_urls=body.logo_urls
        )
        db.add(kit)
    await db.commit()
    return {"ok": True}
