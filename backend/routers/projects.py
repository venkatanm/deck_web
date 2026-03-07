from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from typing import Any
from datetime import datetime, timezone
import uuid
import traceback
from database import get_db
from models import Project
from auth import get_current_user, User

router = APIRouter(prefix="/api/projects", tags=["projects"])

class ProjectSave(BaseModel):
    name: str = "Untitled"
    canvas_size: dict = {"width": 1280, "height": 720}
    pages: list[Any] = []
    thumbnail_url: str | None = None

class AutosaveSave(BaseModel):
    canvas_size: dict
    pages: list[Any]

@router.get("")
async def list_projects(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project)
        .where(and_(
            Project.user_id == user.id,
            Project.is_autosave == False
        ))
        .order_by(Project.updated_at.desc())
    )
    projects = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "canvas_size": p.canvas_size,
            "thumbnail_url": p.thumbnail_url,
            "updated_at": p.updated_at.isoformat(),
            "created_at": p.created_at.isoformat(),
        }
        for p in projects
    ]

@router.post("")
async def create_project(
    body: ProjectSave,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        project = Project(
            user_id=user.id,
            name=body.name,
            canvas_size=body.canvas_size,
            pages=body.pages,
            thumbnail_url=body.thumbnail_url,
            is_autosave=False
        )
        db.add(project)
        await db.commit()
        await db.refresh(project)
        return {"id": str(project.id), "name": project.name}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"Failed to create project: {str(e)}")

# ── Autosave (upsert — one row per user) ───────────
# IMPORTANT: these must be registered BEFORE /{project_id} routes
# or FastAPI will match "autosave" as a project_id UUID and fail.

@router.get("/autosave/current")
async def get_autosave(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project).where(and_(
            Project.user_id == user.id,
            Project.is_autosave == True
        ))
    )
    project = result.scalar_one_or_none()
    if not project:
        return None
    return {
        "canvas_size": project.canvas_size,
        "pages": project.pages,
        "updated_at": project.updated_at.isoformat(),
    }

@router.put("/autosave/current")
async def autosave(
    body: AutosaveSave,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project).where(and_(
            Project.user_id == user.id,
            Project.is_autosave == True
        ))
    )
    project = result.scalar_one_or_none()
    if project:
        project.canvas_size = body.canvas_size
        project.pages       = body.pages
        project.updated_at  = datetime.now(timezone.utc)
    else:
        project = Project(
            user_id=user.id,
            name="__autosave__",
            canvas_size=body.canvas_size,
            pages=body.pages,
            is_autosave=True
        )
        db.add(project)
    await db.commit()
    return {"ok": True}

@router.get("/{project_id}")
async def get_project(
    project_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project).where(and_(
            Project.id == project_id,
            Project.user_id == user.id
        ))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(404, "Project not found")
    return {
        "id": str(project.id),
        "name": project.name,
        "canvas_size": project.canvas_size,
        "pages": project.pages,
        "thumbnail_url": project.thumbnail_url,
        "updated_at": project.updated_at.isoformat(),
    }

@router.put("/{project_id}")
async def update_project(
    project_id: str,
    body: ProjectSave,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project).where(and_(
            Project.id == project_id,
            Project.user_id == user.id
        ))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(404, "Project not found")
    project.name          = body.name
    project.canvas_size   = body.canvas_size
    project.pages         = body.pages
    project.thumbnail_url = body.thumbnail_url
    project.updated_at    = datetime.now(timezone.utc)
    await db.commit()
    return {"id": str(project.id)}

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project).where(and_(
            Project.id == project_id,
            Project.user_id == user.id
        ))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(404, "Not found")
    await db.delete(project)
    await db.commit()
    return {"ok": True}
