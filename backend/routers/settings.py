from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import UserSettings
from auth import get_current_user, User

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("")
async def get_settings(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(UserSettings)
        .where(UserSettings.user_id == user.id)
    )
    s = result.scalar_one_or_none()
    return {"onboarding_done": s.onboarding_done if s else False}

@router.put("/onboarding")
async def complete_onboarding(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(UserSettings)
        .where(UserSettings.user_id == user.id)
    )
    s = result.scalar_one_or_none()
    if s:
        s.onboarding_done = True
    else:
        s = UserSettings(user_id=user.id, onboarding_done=True)
        db.add(s)
    await db.commit()
    return {"ok": True}

@router.delete("/onboarding")
async def reset_onboarding(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(UserSettings)
        .where(UserSettings.user_id == user.id)
    )
    s = result.scalar_one_or_none()
    if s:
        s.onboarding_done = False
    await db.commit()
    return {"ok": True}
