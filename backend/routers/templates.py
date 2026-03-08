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

def _color_to_hex(color, theme_colors: Optional[dict] = None) -> Optional[str]:
    """Convert pptx RGBColor / ThemeColor to hex string, returns None if unavailable."""
    if color is None:
        return None
    try:
        # Direct RGB color — RGBColor doesn't support format spec, use str()
        rgb_str = str(color.rgb).upper()
        if len(rgb_str) == 6:
            return f"#{rgb_str}"
    except Exception:
        pass
    try:
        from pptx.dml.color import _NoneColor
        if isinstance(color, _NoneColor):
            return None
    except Exception:
        pass
    try:
        # Try to resolve theme color via the presentation theme palette
        tc = int(color.theme_color)
        # Apply luminance modifier if present (tints/shades)
        # luminance_modulation is on the underlying _color object or readable from XML
        lum_mod = None
        lum_off = None
        try:
            from pptx.oxml.ns import qn as _qn
            # Access underlying _color object then its XML element
            _c = getattr(color, '_color', None) or color
            _xclr = getattr(_c, '_xClr', None)
            if _xclr is not None:
                lm_el = _xclr.find(_qn('a:lumMod'))
                lo_el = _xclr.find(_qn('a:lumOff'))
                if lm_el is not None:
                    lum_mod = int(lm_el.get('val', '100000')) / 100000.0
                if lo_el is not None:
                    lum_off = int(lo_el.get('val', '0')) / 100000.0
        except Exception:
            pass
        # Fallback: try direct attribute (works for _RGBColor in some pptx versions)
        if lum_mod is None:
            try:
                lum_mod = color.luminance_modulation / 100000.0
            except Exception:
                pass
        if lum_off is None:
            try:
                lum_off = color.luminance_offset / 100000.0
            except Exception:
                pass

        # Use extracted theme palette if available
        if theme_colors and tc in theme_colors:
            hex_c = theme_colors[tc]
        else:
            # Fallback palette (matches Office default theme)
            THEME_MAP = {
                1: "#FFFFFF",  # background 1
                2: "#000000",  # text 1
                3: "#FFFFFF",  # background 2
                4: "#000000",  # text 2
                5: "#4472C4",  # accent 1
                6: "#ED7D31",  # accent 2
                7: "#A9D18E",  # accent 3
                8: "#FF0000",  # accent 4
                9: "#FFC000",  # accent 5
                10: "#5B9BD5", # accent 6
            }
            hex_c = THEME_MAP.get(tc, "#333333")

        # Apply luminance modulation/offset (tint/shade)
        if (lum_mod is not None or lum_off is not None) and hex_c:
            try:
                r = int(hex_c[1:3], 16)
                g = int(hex_c[3:5], 16)
                b = int(hex_c[5:7], 16)
                # Convert to HLS, apply mod/off, convert back
                import colorsys
                h, l, s = colorsys.rgb_to_hls(r/255, g/255, b/255)
                if lum_mod is not None:
                    l = l * lum_mod
                if lum_off is not None:
                    l = l + lum_off
                l = max(0.0, min(1.0, l))
                r2, g2, b2 = colorsys.hls_to_rgb(h, l, s)
                hex_c = f"#{round(r2*255):02X}{round(g2*255):02X}{round(b2*255):02X}"
            except Exception:
                pass
        return hex_c
    except Exception:
        return None


def _extract_theme_colors(prs) -> dict:
    """
    Extract the theme color palette (dk1, lt1, dk2, lt2, accent1-6) from the
    presentation theme XML. Returns a dict mapping theme_color int → hex string.
    Theme color ints follow pptx MSO_THEME_COLOR enum:
      1=dk1/text1, 2=lt1/bg1, 3=dk2/text2, 4=lt2/bg2, 5..10=accent1..6
    """
    result = {}
    slot_order = ["dk1", "lt1", "dk2", "lt2",
                  "accent1", "accent2", "accent3",
                  "accent4", "accent5", "accent6"]

    def _parse_clr_scheme(clrScheme, qn):
        for idx, slot in enumerate(slot_order, start=1):
            el = clrScheme.find(qn(f"a:{slot}"))
            if el is None:
                continue
            rgb_el = el.find(qn("a:srgbClr"))
            if rgb_el is not None:
                val = rgb_el.get("val", "")
                if len(val) == 6:
                    result[idx] = f"#{val.upper()}"
            else:
                sys_el = el.find(qn("a:sysClr"))
                if sys_el is not None:
                    last = sys_el.get("lastClr", "")
                    if len(last) == 6:
                        result[idx] = f"#{last.upper()}"

    try:
        from pptx.oxml.ns import qn
        from lxml import etree

        # Strategy 1: find theme via slide master rels (theme is a separate Part)
        for rel in prs.slide_masters[0].part.rels.values():
            if "theme" in rel.reltype.lower():
                try:
                    blob = rel._target.blob
                    theme_xml = etree.fromstring(blob)
                    clrScheme = theme_xml.find(f".//{qn('a:clrScheme')}")
                    if clrScheme is not None:
                        _parse_clr_scheme(clrScheme, qn)
                        if result:
                            return result
                except Exception:
                    pass

        # Strategy 2: look for a:clrScheme anywhere in master element tree
        try:
            master_el = prs.slide_masters[0].element
            clrScheme = master_el.find(f".//{qn('a:clrScheme')}")
            if clrScheme is not None:
                _parse_clr_scheme(clrScheme, qn)
        except Exception:
            pass
    except Exception:
        pass
    return result


def _resolve_fill_color(fill, default: str = "#cccccc", theme_colors: Optional[dict] = None) -> str:
    """Resolve a pptx FillElement to a hex color string."""
    try:
        from pptx.oxml.ns import qn
        if fill is None or fill.type is None:
            return default
        # Solid fill
        try:
            c = _color_to_hex(fill.fore_color, theme_colors)
            if c:
                return c
        except Exception:
            pass
        # Gradient — use first stop color
        try:
            stops = fill._xPr.findall(f".//{qn('a:gs')}")
            if stops:
                from pptx.dml.color import ColorFormat
                cf = ColorFormat.from_colorelement(stops[0].find(qn('a:srgbClr')) or stops[0].find(qn('a:schemeClr')))
                c = _color_to_hex(cf, theme_colors)
                if c:
                    return c
        except Exception:
            pass
    except Exception:
        pass
    return default


def _emu_to_px(emu: int, canvas_px: int, slide_emu: int) -> float:
    """Scale EMU coordinates to our canvas pixel coordinates."""
    if slide_emu == 0:
        return 0
    return round(emu / slide_emu * canvas_px, 2)


def _shape_fill_color(shape, default: str = "#cccccc", theme_colors: Optional[dict] = None) -> str:
    """Extract fill color from a shape, handling solid, gradient, and theme fills."""
    try:
        return _resolve_fill_color(shape.fill, default, theme_colors)
    except Exception:
        return default


def _shape_stroke(shape, theme_colors: Optional[dict] = None):
    """Extract stroke color and width from a shape. Returns (color_or_None, width_px)."""
    try:
        line = shape.line
        if line and line.width and line.width > 0:
            width_pt = max(round(line.width.pt), 1)
            color = None
            try:
                color = _color_to_hex(line.color, theme_colors)
            except Exception:
                pass
            return color or "#000000", width_pt
    except Exception:
        pass
    return None, 0


def _slide_bg_color(slide, theme_colors: Optional[dict] = None) -> Optional[str]:
    """Extract per-slide background color, falling back to layout then master."""
    def _fill_color(obj):
        try:
            fill = obj.background.fill
            if fill.type is not None:
                c = _resolve_fill_color(fill, "#cccccc", theme_colors)
                if c and c != "#cccccc":
                    return c
        except Exception:
            pass
        return None

    # 1. Slide-specific background
    c = _fill_color(slide)
    if c:
        return c
    # 2. Layout background
    try:
        c = _fill_color(slide.slide_layout)
        if c:
            return c
    except Exception:
        pass
    # 3. Master background
    try:
        c = _fill_color(slide.slide_layout.slide_master)
        if c:
            return c
    except Exception:
        pass
    return None


def _font_family_map(pptx_name: Optional[str]) -> str:
    """Map a PPTX font name to the closest available web font."""
    if not pptx_name:
        return "Inter"
    name_lower = pptx_name.lower().strip()
    # Theme font placeholders
    if name_lower in ("+mj-lt", "+mn-lt", "calibri light", "calibri"):
        return "Inter"
    mapping = {
        "arial": "Inter",
        "helvetica": "Inter",
        "trebuchet ms": "Inter",
        "verdana": "Inter",
        "tahoma": "Inter",
        "gill sans": "Inter",
        "gill sans mt": "Inter",
        "century gothic": "Montserrat",
        "futura": "Montserrat",
        "montserrat": "Montserrat",
        "poppins": "Poppins",
        "open sans": "Open Sans",
        "lato": "Lato",
        "raleway": "Raleway",
        "oswald": "Oswald",
        "times new roman": "Georgia",
        "times": "Georgia",
        "georgia": "Georgia",
        "garamond": "Playfair Display",
        "palatino": "Playfair Display",
        "playfair display": "Playfair Display",
        "merriweather": "Merriweather",
        "courier": "Inter",
        "courier new": "Inter",
        "impact": "Oswald",
        "bebas neue": "Bebas Neue",
    }
    for key, val in mapping.items():
        if key in name_lower:
            return val
    # Return original name — browser will fall back to Inter if unavailable
    return pptx_name


def _parse_text_frame(tf, base: dict, slide_w_emu: int, slide_h_emu: int, canvas_w: int, canvas_h: int, theme_colors: Optional[dict] = None) -> Optional[dict]:
    """Parse a text frame into a text element. Returns None if empty."""
    from pptx.enum.text import PP_ALIGN

    paragraphs_text = []
    font_size = 18
    fill_color = "#1e293b"
    align = "left"
    bold = False
    italic = False
    font_family = "Inter"

    for para in tf.paragraphs:
        para_text = "".join(run.text for run in para.runs)
        paragraphs_text.append(para_text)

        if para.runs:
            run = para.runs[0]
            if run.font.size:
                try:
                    font_size = round(run.font.size.pt)
                except Exception:
                    pass
            if run.font.color and run.font.color.type is not None:
                c = _color_to_hex(run.font.color, theme_colors)
                if c:
                    fill_color = c
            if run.font.bold:
                bold = True
            if run.font.italic:
                italic = True
            try:
                fn = run.font.name
                if fn:
                    font_family = _font_family_map(fn)
            except Exception:
                pass
        try:
            if para.alignment == PP_ALIGN.CENTER:
                align = "center"
            elif para.alignment == PP_ALIGN.RIGHT:
                align = "right"
        except Exception:
            pass

    full_text = "\n".join(paragraphs_text).strip()
    if not full_text:
        return None

    font_style = "normal"
    if bold and italic:
        font_style = "bold italic"
    elif bold:
        font_style = "bold"
    elif italic:
        font_style = "italic"

    return {
        **base,
        "type": "text",
        "content": full_text,
        "text": full_text,
        "fontSize": max(font_size, 8),
        "fontFamily": font_family,
        "fontStyle": font_style,
        "fill": fill_color,
        "align": align,
    }


def _parse_pptx(data: bytes) -> tuple[list[dict], int, int, str]:
    """
    Parse a PPTX file and return (slides, canvas_w, canvas_h, bg_color).
    slides is a list of slide dicts: [{"elements": [...], "backgroundColor": ...}]
    Canvas size is derived from the actual PPTX slide dimensions.
    """
    try:
        from pptx import Presentation
        from pptx.enum.shapes import MSO_SHAPE_TYPE
        from pptx.util import Emu
    except ImportError:
        raise HTTPException(500, "python-pptx is not installed on the server.")

    prs = Presentation(io.BytesIO(data))
    slide_w_emu = prs.slide_width
    slide_h_emu = prs.slide_height

    # Extract theme color palette for proper theme-color resolution
    theme_colors = _extract_theme_colors(prs)

    # Derive canvas size from aspect ratio, targeting 1280×720 baseline
    # Standard 16:9 → 1280×720; 4:3 → 960×720
    aspect = slide_w_emu / slide_h_emu if slide_h_emu else 16 / 9
    canvas_h = 720
    canvas_w = round(canvas_h * aspect)

    slides_out = []
    first_bg = "#ffffff"

    for slide_idx, slide in enumerate(prs.slides):
        elements = []

        # Per-slide background
        bg_color = _slide_bg_color(slide, theme_colors) or "#ffffff"
        if slide_idx == 0:
            first_bg = bg_color

        def proc_shape(shape, _bg=bg_color, _tc=theme_colors):
            """Process a single shape into element(s), appending to elements list."""
            try:
                left   = _emu_to_px(shape.left   or 0, canvas_w, slide_w_emu)
                top    = _emu_to_px(shape.top    or 0, canvas_h, slide_h_emu)
                width  = _emu_to_px(shape.width  or 0, canvas_w, slide_w_emu)
                height = _emu_to_px(shape.height or 0, canvas_h, slide_h_emu)

                base = {
                    "id": str(uuid.uuid4()),
                    "x": left, "y": top,
                    "width": max(width, 4),
                    "height": max(height, 4),
                    "rotation": getattr(shape, "rotation", 0) or 0,
                    "opacity": 1,
                }

                # ── Group shape — recurse into children ────────────────
                try:
                    if shape.shape_type == MSO_SHAPE_TYPE.GROUP:
                        for child in shape.shapes:
                            proc_shape(child)
                        return
                except Exception:
                    pass

                # ── Text frame (may also have a background fill) ────────
                if shape.has_text_frame:
                    tf = shape.text_frame
                    el = _parse_text_frame(tf, base, slide_w_emu, slide_h_emu, canvas_w, canvas_h, _tc)
                    if el:
                        # If the shape also has a visible background fill, add a rect behind
                        try:
                            if shape.fill and shape.fill.type is not None:
                                fill_c = _resolve_fill_color(shape.fill, "", _tc)
                                if fill_c and fill_c != _bg:
                                    stroke_c, stroke_w = _shape_stroke(shape, _tc)
                                    cr = 0
                                    try:
                                        from pptx.oxml.ns import qn
                                        prstGeom = shape._element.find(f".//{qn('a:prstGeom')}")
                                        if prstGeom is not None:
                                            prst = prstGeom.get("prst", "")
                                            if "round" in prst or "round" in prst.lower():
                                                cr = 8
                                    except Exception:
                                        pass
                                    elements.append({
                                        **base,
                                        "id": str(uuid.uuid4()),
                                        "type": "rect",
                                        "fill": fill_c,
                                        "stroke": stroke_c,
                                        "strokeWidth": stroke_w,
                                        "cornerRadius": cr,
                                    })
                        except Exception:
                            pass
                        elements.append(el)
                    return

                # ── Picture ────────────────────────────────────────────
                try:
                    if shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
                        # Embed the image as a base64 data URL, capped at 800px wide
                        try:
                            import base64
                            from PIL import Image as PILImage
                            img_blob = shape.image.blob
                            ct = shape.image.content_type or "image/png"
                            MAX_PX = 800
                            try:
                                pil_img = PILImage.open(io.BytesIO(img_blob))
                                if pil_img.width > MAX_PX or pil_img.height > MAX_PX:
                                    pil_img.thumbnail((MAX_PX, MAX_PX), PILImage.LANCZOS)
                                out_buf = io.BytesIO()
                                fmt = "JPEG" if ct in ("image/jpeg", "image/jpg") else "PNG"
                                if fmt == "JPEG" and pil_img.mode in ("RGBA", "P"):
                                    pil_img = pil_img.convert("RGB")
                                pil_img.save(out_buf, format=fmt, quality=82, optimize=True)
                                img_blob = out_buf.getvalue()
                                ct = "image/jpeg" if fmt == "JPEG" else "image/png"
                            except Exception:
                                pass  # use original blob if PIL fails
                            b64 = base64.b64encode(img_blob).decode("utf-8")
                            src = f"data:{ct};base64,{b64}"
                            elements.append({
                                **base,
                                "type": "image",
                                "src": src,
                                "imageId": None,
                                "objectFit": "cover",
                            })
                        except Exception:
                            # Fallback: grey placeholder rect
                            elements.append({
                                **base,
                                "type": "rect",
                                "fill": "#cbd5e1",
                                "cornerRadius": 4,
                                "stroke": None,
                                "strokeWidth": 0,
                            })
                        return
                except Exception:
                    pass

                # ── Line / connector ──────────────────────────────────
                try:
                    if shape.shape_type in (MSO_SHAPE_TYPE.LINE, MSO_SHAPE_TYPE.FREEFORM):
                        stroke_c, stroke_w = _shape_stroke(shape, _tc)
                        elements.append({
                            **base,
                            "type": "line",
                            "stroke": stroke_c or "#333333",
                            "strokeWidth": stroke_w or 2,
                            "fill": None,
                        })
                        return
                except Exception:
                    pass

                # ── Auto-shape (rect, ellipse, etc.) ──────────────────
                try:
                    fill_c = _shape_fill_color(shape, "#cccccc", _tc)
                    stroke_c, stroke_w = _shape_stroke(shape, _tc)

                    # Determine shape type from preset geometry
                    el_type = "rect"
                    corner_radius = 0
                    try:
                        from pptx.oxml.ns import qn
                        prstGeom = shape._element.find(f".//{qn('a:prstGeom')}")
                        if prstGeom is not None:
                            prst = prstGeom.get("prst", "").lower()
                            if prst in ("ellipse", "oval", "circle"):
                                el_type = "ellipse"
                            elif "roundRect" in prstGeom.get("prst", "") or "round" in prst:
                                corner_radius = 12
                            elif prst in ("triangle", "rtTriangle"):
                                el_type = "triangle"
                    except Exception:
                        pass

                    el = {
                        **base,
                        "type": el_type,
                        "fill": fill_c,
                        "stroke": stroke_c,
                        "strokeWidth": stroke_w,
                    }
                    if el_type == "rect":
                        el["cornerRadius"] = corner_radius
                    elements.append(el)
                except Exception:
                    pass
            except Exception:
                pass  # skip broken shapes

        # Process slide layout and master shapes first (background decorations)
        # These provide the template chrome (colored strips, decorative shapes, etc.)
        try:
            layout = slide.slide_layout
            for shape in layout.shapes:
                # Only include non-placeholder shapes (placeholders are slide-specific)
                try:
                    if shape.is_placeholder:
                        continue
                except Exception:
                    pass
                proc_shape(shape)
        except Exception:
            pass
        try:
            master = slide.slide_layout.slide_master
            for shape in master.shapes:
                try:
                    if shape.is_placeholder:
                        continue
                except Exception:
                    pass
                proc_shape(shape)
        except Exception:
            pass

        # Process slide-specific shapes on top
        for shape in slide.shapes:
            proc_shape(shape)

        slides_out.append({"elements": elements, "backgroundColor": bg_color})

    return _json_safe(slides_out), canvas_w, canvas_h, first_bg


def _json_safe(obj):
    """Recursively convert all values to JSON-serializable Python primitives."""
    if isinstance(obj, dict):
        return {k: _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_json_safe(v) for v in obj]
    if isinstance(obj, bool):
        return obj
    if isinstance(obj, int):
        return int(obj)
    if isinstance(obj, float):
        return float(obj)
    if obj is None:
        return None
    if isinstance(obj, str):
        return obj
    # Fallback: convert unknown types (numpy floats, Decimal, etc.) via str then float/int
    try:
        return float(obj)
    except Exception:
        pass
    return str(obj)


def _bg_color(prs) -> str:
    """Try to extract background color from the first slide; fallback to white."""
    try:
        slide = prs.slides[0]
        c = _slide_bg_color(slide)
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
        slides, canvas_w, canvas_h, bg = _parse_pptx(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(422, f"Could not parse PPTX: {e}")

    template_name = name.strip() or file.filename.replace(".pptx", "").replace("_", " ").title()

    # Upsert: if a same-named template already exists in the same scope, replace it
    owner_id = None if is_global else user.id
    existing = await db.execute(
        select(Template).where(
            Template.name == template_name,
            Template.user_id == owner_id,
            Template.is_global == is_global,
        )
    )
    tpl = existing.scalar_one_or_none()
    if tpl:
        tpl.canvas_size = {"width": canvas_w, "height": canvas_h, "backgroundColor": bg}
        tpl.slides = slides
        tpl.thumbnail_bg = bg
        tpl.source_format = "pptx"
    else:
        tpl = Template(
            user_id=owner_id,
            name=template_name,
            category="Global" if is_global else "My Uploads",
            tags=["pptx", "uploaded"],
            canvas_size={"width": canvas_w, "height": canvas_h, "backgroundColor": bg},
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
