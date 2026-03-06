"""
Templates router — handles user and admin template management including PPTX import.

PPTX parsing uses python-pptx.  The conversion is best-effort:
  • Text boxes  → text elements
  • Rectangles / rounded-rects → rect elements
  • Pictures    → image placeholder elements (no actual image data)
  • Fill colors are extracted as hex strings

Install: pip install python-pptx  (added to requirements.txt)
"""
from __future__ import annotations

import io
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import Template, User

router = APIRouter(prefix="/api/templates", tags=["templates"])

MAX_PPTX_SIZE = 50 * 1024 * 1024  # 50 MB


# ── helpers ────────────────────────────────────────────────────────────────────

def _color_to_hex(color) -> Optional[str]:
    """Convert pptx RGBColor / ThemeColor to hex string, returns None if transparent."""
    try:
        return f"#{color.rgb:06X}"
    except Exception:
        return None


def _emu_to_px(emu: int, canvas_px: int, slide_emu: int) -> float:
    """Scale EMU coordinates to our canvas pixel coordinates."""
    if slide_emu == 0:
        return 0
    return round(emu / slide_emu * canvas_px, 2)


def _parse_pptx(data: bytes, canvas_w: int = 1920, canvas_h: int = 1080) -> list[dict]:
    """
    Parse a PPTX file and return slides in our element format.
    Returns a list of slide dicts: [{"elements": [...]}]
    """
    try:
        from pptx import Presentation
        from pptx.util import Pt
        from pptx.enum.shapes import MSO_SHAPE_TYPE
    except ImportError:
        raise HTTPException(500, "python-pptx is not installed on the server.")

    prs = Presentation(io.BytesIO(data))
    slide_w_emu = prs.slide_width
    slide_h_emu = prs.slide_height

    slides_out = []

    for slide in prs.slides:
        elements = []

        for shape in slide.shapes:
            left   = _emu_to_px(shape.left   or 0, canvas_w, slide_w_emu)
            top    = _emu_to_px(shape.top    or 0, canvas_h, slide_h_emu)
            width  = _emu_to_px(shape.width  or 0, canvas_w, slide_w_emu)
            height = _emu_to_px(shape.height or 0, canvas_h, slide_h_emu)

            base = {
                "id": str(uuid.uuid4()),
                "x": left, "y": top,
                "width": max(width, 10),
                "height": max(height, 10),
                "rotation": shape.rotation if hasattr(shape, "rotation") else 0,
                "opacity": 1,
            }

            # ── Text frames ────────────────────────────────────────────────
            if shape.has_text_frame:
                tf = shape.text_frame
                full_text = "\n".join(
                    "".join(run.text for run in para.runs)
                    for para in tf.paragraphs
                ).strip()
                if not full_text:
                    continue

                # Pick font size from first run of first paragraph
                font_size = 18
                fill_color = "#1e293b"
                align = "left"
                font_style = "normal"

                for para in tf.paragraphs:
                    if para.runs:
                        run = para.runs[0]
                        if run.font.size:
                            font_size = round(run.font.size.pt)
                        if run.font.color and run.font.color.type is not None:
                            c = _color_to_hex(run.font.color)
                            if c:
                                fill_color = c
                        if run.font.bold:
                            font_style = "bold"
                        if run.font.italic:
                            font_style = font_style + " italic" if font_style != "normal" else "italic"
                    # alignment
                    from pptx.enum.text import PP_ALIGN
                    if para.alignment == PP_ALIGN.CENTER:
                        align = "center"
                    elif para.alignment == PP_ALIGN.RIGHT:
                        align = "right"
                    break

                elements.append({
                    **base,
                    "type": "text",
                    "content": full_text,
                    "text": full_text,
                    "fontSize": max(font_size, 8),
                    "fontFamily": "Inter",
                    "fontStyle": font_style,
                    "fill": fill_color,
                    "align": align,
                })
                continue

            # ── Pictures ────────────────────────────────────────────────────
            try:
                if shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
                    elements.append({
                        **base,
                        "type": "rect",
                        "fill": "#cbd5e1",
                        "cornerRadius": 4,
                        "stroke": None,
                        "strokeWidth": 0,
                    })
                    continue
            except Exception:
                pass

            # ── Geometric shapes / filled rectangles ─────────────────────
            try:
                fill_color = "#7c3aed"
                if shape.fill and shape.fill.type is not None:
                    c = _color_to_hex(shape.fill.fore_color) if hasattr(shape.fill, "fore_color") else None
                    if c:
                        fill_color = c

                stroke_color = None
                stroke_width = 0
                if shape.line and shape.line.width:
                    from pptx.util import Pt as _Pt
                    stroke_width = max(round(shape.line.width.pt), 1)
                    if shape.line.color and shape.line.color.type is not None:
                        c = _color_to_hex(shape.line.color)
                        if c:
                            stroke_color = c

                elements.append({
                    **base,
                    "type": "rect",
                    "fill": fill_color,
                    "stroke": stroke_color,
                    "strokeWidth": stroke_width,
                    "cornerRadius": 0,
                })
            except Exception:
                pass  # skip unsupported shapes

        slides_out.append({"elements": elements})

    return slides_out


def _bg_color(prs) -> str:
    """Try to extract background color from the first slide; fallback to white."""
    try:
        from pptx.enum.dml import MSO_THEME_COLOR
        slide = prs.slides[0]
        bg = slide.background
        fill = bg.fill
        if fill.type is not None:
            c = _color_to_hex(fill.fore_color)
            if c:
                return c
    except Exception:
        pass
    return "#ffffff"


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.get("")
async def list_templates(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return global templates + this user's private templates."""
    result = await db.execute(
        select(Template).where(
            or_(Template.is_global.is_(True), Template.user_id == user.id)
        ).order_by(Template.created_at.desc())
    )
    templates = result.scalars().all()
    return [_template_out(t) for t in templates]


@router.post("/upload-pptx")
async def upload_pptx(
    file: UploadFile = File(...),
    name: str = Form(""),
    is_global: bool = Form(False),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a PPTX file, parse it, and store as a Template.
    is_global=True requires admin privileges.
    """
    if is_global and not user.is_admin:
        raise HTTPException(403, "Admin privileges required to create global templates.")

    data = await file.read()
    if len(data) > MAX_PPTX_SIZE:
        raise HTTPException(413, "File exceeds 50 MB limit.")
    if not file.filename.lower().endswith(".pptx"):
        raise HTTPException(400, "Only .pptx files are supported.")

    # Parse PPTX
    try:
        from pptx import Presentation as _Prs
        prs = _Prs(io.BytesIO(data))
        bg = _bg_color(prs)
    except ImportError:
        raise HTTPException(500, "python-pptx is not installed on the server.")
    except Exception as e:
        raise HTTPException(422, f"Could not parse PPTX: {e}")

    slides = _parse_pptx(data)

    template_name = name.strip() or file.filename.replace(".pptx", "").replace("_", " ").title()

    tpl = Template(
        user_id=None if is_global else user.id,
        name=template_name,
        category="Global" if is_global else "My Uploads",
        tags=["pptx", "uploaded"],
        canvas_size={"width": 1920, "height": 1080, "backgroundColor": bg},
        slides=slides,
        thumbnail_bg=bg,
        is_global=is_global,
        source_format="pptx",
    )
    db.add(tpl)
    await db.commit()
    await db.refresh(tpl)
    return _template_out(tpl)


@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Template).where(Template.id == template_id)
    )
    tpl = result.scalar_one_or_none()
    if not tpl:
        raise HTTPException(404, "Template not found.")
    # Non-admins can only delete their own templates
    if not user.is_admin and tpl.user_id != user.id:
        raise HTTPException(403, "Not authorized.")
    await db.delete(tpl)
    await db.commit()
    return {"ok": True}


# ── Admin: promote user to admin ──────────────────────────────────────────────

class PromoteBody(BaseModel):
    email: str

@router.post("/admin/promote")
async def promote_to_admin(
    body: PromoteBody,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_admin:
        raise HTTPException(403, "Admin privileges required.")
    result = await db.execute(select(User).where(User.email == body.email))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(404, "User not found.")
    target.is_admin = True
    await db.commit()
    return {"ok": True, "email": target.email}


@router.get("/admin/users")
async def list_users(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_admin:
        raise HTTPException(403, "Admin privileges required.")
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [
        {"id": str(u.id), "email": u.email, "is_admin": u.is_admin,
         "created_at": u.created_at.isoformat()}
        for u in users
    ]


# ── helper ────────────────────────────────────────────────────────────────────

def _template_out(t: Template) -> dict:
    return {
        "id": str(t.id),
        "name": t.name,
        "category": t.category,
        "tags": t.tags or [],
        "canvasSize": t.canvas_size,
        "canvas_size": t.canvas_size,
        "slides": t.slides or [],
        "thumbnail": {"bg": t.thumbnail_bg or "#f1f5f9"},
        "thumbnail_bg": t.thumbnail_bg,
        "is_global": t.is_global,
        "source_format": t.source_format,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }
