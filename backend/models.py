from sqlalchemy import (
    Column, String, Boolean, Integer,
    ForeignKey, Text, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, TIMESTAMP
from sqlalchemy.sql import func
from database import Base
import uuid

class User(Base):
    __tablename__ = "users"
    id            = Column(UUID(as_uuid=True), primary_key=True,
                           default=uuid.uuid4)
    email         = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    is_admin      = Column(Boolean, default=False, nullable=False)
    created_at    = Column(TIMESTAMP(timezone=True),
                           server_default=func.now())

class Project(Base):
    __tablename__ = "projects"
    id            = Column(UUID(as_uuid=True), primary_key=True,
                           default=uuid.uuid4)
    user_id       = Column(UUID(as_uuid=True),
                           ForeignKey("users.id", ondelete="CASCADE"))
    name          = Column(Text, nullable=False, default="Untitled")
    canvas_size   = Column(JSONB, nullable=False,
                           default={"width": 1280, "height": 720})
    pages         = Column(JSONB, nullable=False, default=list)
    thumbnail_url = Column(Text)
    is_autosave   = Column(Boolean, default=False)
    updated_at    = Column(TIMESTAMP(timezone=True),
                           server_default=func.now(),
                           onupdate=func.now())
    created_at    = Column(TIMESTAMP(timezone=True),
                           server_default=func.now())

class BrandKit(Base):
    __tablename__ = "brand_kits"
    id         = Column(UUID(as_uuid=True), primary_key=True,
                        default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True),
                        ForeignKey("users.id", ondelete="CASCADE"),
                        unique=True)
    colors     = Column(JSONB, default=list)
    fonts      = Column(JSONB, default=list)
    logo_urls  = Column(JSONB, default=list)
    updated_at = Column(TIMESTAMP(timezone=True),
                        server_default=func.now(),
                        onupdate=func.now())

class Image(Base):
    __tablename__ = "images"
    id         = Column(UUID(as_uuid=True), primary_key=True,
                        default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True),
                        ForeignKey("users.id", ondelete="CASCADE"))
    name       = Column(Text)
    type       = Column(Text)
    size_bytes = Column(Integer)
    minio_key  = Column(Text, nullable=False)
    url        = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True),
                        server_default=func.now())

class Template(Base):
    """
    User-uploaded or admin-added templates.
    is_global=True  → available to all users (admin-uploaded)
    is_global=False → only visible to the owning user
    """
    __tablename__ = "templates"
    id            = Column(UUID(as_uuid=True), primary_key=True,
                           default=uuid.uuid4)
    user_id       = Column(UUID(as_uuid=True),
                           ForeignKey("users.id", ondelete="CASCADE"),
                           nullable=True)   # null for global templates
    name          = Column(Text, nullable=False)
    category      = Column(Text, default="Uploads")
    tags          = Column(JSONB, default=list)
    canvas_size   = Column(JSONB, nullable=False,
                           default={"width": 1920, "height": 1080})
    slides        = Column(JSONB, nullable=False, default=list)
    thumbnail_bg  = Column(Text, default="#f1f5f9")
    is_global     = Column(Boolean, default=False)
    source_format = Column(Text, default="pptx")   # "pptx" | "json"
    created_at    = Column(TIMESTAMP(timezone=True),
                           server_default=func.now())

class Event(Base):
    __tablename__ = "events"
    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    name       = Column(Text, nullable=False)          # e.g. "project.saved"
    properties = Column(JSONB, default=dict)           # arbitrary metadata
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

class Feedback(Base):
    __tablename__ = "feedback"
    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type           = Column(String(20), nullable=False)   # 'survey' | 'button'
    survey_trigger = Column(String(50))                   # 'first_export' | 'doc_to_deck' | 'brand_kit_save' | 'nps'
    user_id        = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user_email     = Column(String(255))
    session_id     = Column(String(100))
    rating         = Column(Integer)                      # 1–5 or 0–10 (NPS)
    primary_answer = Column(Text)
    follow_up_text = Column(Text)
    sentiment      = Column(String(10))                   # 'positive' | 'neutral' | 'negative'
    page_context   = Column(String(100))
    deck_id        = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    app_version    = Column(String(20))
    created_at     = Column(TIMESTAMP(timezone=True), server_default=func.now())
    is_read        = Column(Boolean, default=False, nullable=False)
    is_archived    = Column(Boolean, default=False, nullable=False)
    admin_note     = Column(Text)


class UserSurveyState(Base):
    __tablename__ = "user_survey_state"
    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    trigger_key = Column(String(50), nullable=False)   # 'first_export' | 'doc_to_deck' | 'brand_kit_save' | 'nps'
    status      = Column(String(20), nullable=False)   # 'answered' | 'dismissed' | 'auto_dismissed'
    created_at  = Column(TIMESTAMP(timezone=True), server_default=func.now())
    __table_args__ = (UniqueConstraint("user_id", "trigger_key", name="uq_survey_state"),)


class UserSettings(Base):
    __tablename__ = "user_settings"
    user_id         = Column(UUID(as_uuid=True),
                             ForeignKey("users.id", ondelete="CASCADE"),
                             primary_key=True)
    onboarding_done = Column(Boolean, default=False)
    updated_at      = Column(TIMESTAMP(timezone=True),
                             server_default=func.now(),
                             onupdate=func.now())
