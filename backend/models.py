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

class UserSettings(Base):
    __tablename__ = "user_settings"
    user_id         = Column(UUID(as_uuid=True),
                             ForeignKey("users.id", ondelete="CASCADE"),
                             primary_key=True)
    onboarding_done = Column(Boolean, default=False)
    updated_at      = Column(TIMESTAMP(timezone=True),
                             server_default=func.now(),
                             onupdate=func.now())
