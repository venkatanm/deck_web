CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'Untitled',
  canvas_size   JSONB NOT NULL DEFAULT '{"width":1280,"height":720}',
  pages         JSONB NOT NULL DEFAULT '[]',
  thumbnail_url TEXT,
  is_autosave   BOOLEAN DEFAULT false,
  updated_at    TIMESTAMPTZ DEFAULT now(),
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_projects_user ON projects(user_id, updated_at DESC);
CREATE UNIQUE INDEX idx_projects_autosave
  ON projects(user_id) WHERE is_autosave = true;

CREATE TABLE brand_kits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  colors      JSONB DEFAULT '[]',
  fonts       JSONB DEFAULT '[]',
  logo_urls   JSONB DEFAULT '[]',
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT,
  type        TEXT,
  size_bytes  INTEGER,
  minio_key   TEXT NOT NULL,
  url         TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_images_user ON images(user_id, created_at DESC);

CREATE TABLE user_settings (
  user_id         UUID PRIMARY KEY REFERENCES users(id),
  onboarding_done BOOLEAN DEFAULT false,
  updated_at      TIMESTAMPTZ DEFAULT now()
);
