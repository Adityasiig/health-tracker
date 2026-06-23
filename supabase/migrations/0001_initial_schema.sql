-- Health Tracker — Postgres schema for Supabase
-- Mirrors the SQLite schema from the Flask version, with Postgres types.
-- Run this in Supabase Dashboard → SQL Editor → New query → paste → Run.

-- ============ profile (single row, id=1) ============
CREATE TABLE IF NOT EXISTS profile (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  name            TEXT,
  sex             TEXT NOT NULL CHECK (sex IN ('male', 'female')),
  age             INTEGER NOT NULL CHECK (age BETWEEN 10 AND 100),
  height_cm       REAL NOT NULL,
  weight_kg       REAL NOT NULL,
  activity        TEXT NOT NULL,
  goal            TEXT NOT NULL,
  ethnicity       TEXT DEFAULT 'asian_indian',
  water_goal_ml   INTEGER DEFAULT 4000,
  goal_weight_kg  REAL,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============ foods (curated DB + USDA imports + custom) ============
CREATE TABLE IF NOT EXISTS foods (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT UNIQUE NOT NULL,
  category     TEXT,
  unit         TEXT NOT NULL,
  unit_grams   REAL,
  kcal         REAL NOT NULL,
  protein_g    REAL NOT NULL,
  carbs_g      REAL NOT NULL,
  fat_g        REAL NOT NULL,
  fiber_g      REAL NOT NULL,
  is_custom    INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_food_name ON foods (LOWER(name));

-- ============ log_entries (food diary) ============
CREATE TABLE IF NOT EXISTS log_entries (
  id              BIGSERIAL PRIMARY KEY,
  log_date        DATE NOT NULL,
  eaten_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  food_id         BIGINT NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  quantity        REAL NOT NULL,
  note            TEXT DEFAULT '',
  meal_category   TEXT DEFAULT 'snack' CHECK (meal_category IN ('breakfast','lunch','dinner','snack'))
);
CREATE INDEX IF NOT EXISTS idx_log_date ON log_entries (log_date);
CREATE INDEX IF NOT EXISTS idx_log_food ON log_entries (food_id);

-- ============ water_log ============
CREATE TABLE IF NOT EXISTS water_log (
  id          BIGSERIAL PRIMARY KEY,
  log_date    DATE NOT NULL,
  eaten_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ml_amount   INTEGER NOT NULL CHECK (ml_amount > 0)
);
CREATE INDEX IF NOT EXISTS idx_water_date ON water_log (log_date);

-- ============ weight_log ============
CREATE TABLE IF NOT EXISTS weight_log (
  id            BIGSERIAL PRIMARY KEY,
  log_date      DATE UNIQUE NOT NULL,
  kg_value      REAL NOT NULL,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ chat_log (AI Coach conversation history) ============
CREATE TABLE IF NOT EXISTS chat_log (
  id           BIGSERIAL PRIMARY KEY,
  role         TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_log (created_at);

-- ============ usda_cache (memoize USDA FDC responses) ============
CREATE TABLE IF NOT EXISTS usda_cache (
  cache_key       TEXT PRIMARY KEY,
  response_json   TEXT NOT NULL,
  cached_at       BIGINT NOT NULL
);

-- Row Level Security: single-user app, lock everything to the service_role key only.
-- (We don't expose anon access to any of these tables.)
ALTER TABLE profile     ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods       ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_log  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE usda_cache  ENABLE ROW LEVEL SECURITY;
-- Only the service_role key bypasses RLS (which is what the Vercel Route Handlers use).
