from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from database import get_db
from models import Image
from auth import get_current_user, User
from storage import upload_file, delete_file

router = APIRouter(prefix="/api/images", tags=["images"])

MAX_SIZE = 20 * 1024 * 1024  # 20MB per image

@router.get("")
async def list_images(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Image)
        .where(Image.user_id == user.id)
        .order_by(Image.created_at.desc())
    )
    images = result.scalars().all()
    return [
        {
            "id": str(img.id),
            "name": img.name,
            "type": img.type,
            "size_bytes": img.size_bytes,
            "url": img.url,
            "created_at": img.created_at.isoformat(),
        }
        for img in images
    ]

@router.post("")
async def upload_image(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(413, "File exceeds 20MB limit")

    minio_key, url = upload_file(
        data, file.filename,
        file.content_type or "application/octet-stream", str(user.id)
    )
    image = Image(
        user_id=user.id,
        name=file.filename,
        type=file.content_type,
        size_bytes=len(data),
        minio_key=minio_key,
        url=url
    )
    db.add(image)
    await db.commit()
    await db.refresh(image)
    return {
        "id": str(image.id),
        "name": image.name,
        "url": image.url,
    }

@router.get("/{image_id}")
async def get_image(
    image_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Image).where(and_(
            Image.id == image_id,
            Image.user_id == user.id
        ))
    )
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(404, "Not found")
    return {"id": str(image.id), "url": image.url}

@router.delete("/{image_id}")
async def delete_image(
    image_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Image).where(and_(
            Image.id == image_id,
            Image.user_id == user.id
        ))
    )
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(404, "Not found")
    delete_file(image.minio_key)
    await db.delete(image)
    await db.commit()
    return {"ok": True}
