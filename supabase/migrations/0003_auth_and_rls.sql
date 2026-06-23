-- =====================================================================
-- Migration 0003: Multi-user auth — add user_id columns + Row Level Security
-- =====================================================================
-- Run this in Supabase SQL Editor AFTER you've signed up at least one user
-- via the new /signup page in the app, OR run it first and the migration
-- helper will assign existing rows to a user_id once you sign up.
--
-- This adds:
--   * user_id UUID columns on per-user tables (profile, log_entries, etc.)
--   * RLS policies so each user only sees their own rows
--   * Public foods stay readable by all; custom foods become per-user
-- =====================================================================

-- ============ profile ============
-- profile is the per-user "stats" row. One row per auth.users.
ALTER TABLE profile DROP CONSTRAINT IF EXISTS profile_pkey;
ALTER TABLE profile DROP CONSTRAINT IF EXISTS profile_id_check;
ALTER TABLE profile ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- We're keeping the existing 'id' integer column for now but won't rely on it.
-- The natural key going forward is user_id.
CREATE UNIQUE INDEX IF NOT EXISTS profile_user_id_unique ON profile (user_id) WHERE user_id IS NOT NULL;

-- ============ log_entries ============
ALTER TABLE log_entries ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_log_user ON log_entries (user_id);

-- ============ water_log ============
ALTER TABLE water_log ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_water_user ON water_log (user_id);

-- ============ weight_log ============
-- weight_log used to have UNIQUE(log_date). Now it's UNIQUE(user_id, log_date)
-- so different users can log the same date.
ALTER TABLE weight_log ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE weight_log DROP CONSTRAINT IF EXISTS weight_log_log_date_key;
CREATE UNIQUE INDEX IF NOT EXISTS weight_log_user_date_unique ON weight_log (user_id, log_date) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_weight_user ON weight_log (user_id);

-- ============ chat_log ============
ALTER TABLE chat_log ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_log (user_id);

-- ============ foods ============
-- Foods table is shared (the 116 seed foods). Custom user-created foods
-- get an owner_id; public foods stay with owner_id NULL.
ALTER TABLE foods ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_foods_owner ON foods (owner_id);

-- =====================================================================
-- RLS POLICIES
-- =====================================================================
-- We already enabled RLS in migration 0001. Now define what each user
-- can actually do.  The service_role key (used in our Route Handlers
-- when needed) bypasses RLS entirely.
--
-- Drop any old policies first (idempotent re-run)
-- =====================================================================

-- ---------- profile ----------
DROP POLICY IF EXISTS "profile_select_own" ON profile;
DROP POLICY IF EXISTS "profile_insert_own" ON profile;
DROP POLICY IF EXISTS "profile_update_own" ON profile;
DROP POLICY IF EXISTS "profile_delete_own" ON profile;
CREATE POLICY "profile_select_own" ON profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profile_insert_own" ON profile FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profile_update_own" ON profile FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profile_delete_own" ON profile FOR DELETE USING (auth.uid() = user_id);

-- ---------- log_entries ----------
DROP POLICY IF EXISTS "log_entries_select_own" ON log_entries;
DROP POLICY IF EXISTS "log_entries_insert_own" ON log_entries;
DROP POLICY IF EXISTS "log_entries_update_own" ON log_entries;
DROP POLICY IF EXISTS "log_entries_delete_own" ON log_entries;
CREATE POLICY "log_entries_select_own" ON log_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "log_entries_insert_own" ON log_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "log_entries_update_own" ON log_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "log_entries_delete_own" ON log_entries FOR DELETE USING (auth.uid() = user_id);

-- ---------- water_log ----------
DROP POLICY IF EXISTS "water_log_select_own" ON water_log;
DROP POLICY IF EXISTS "water_log_insert_own" ON water_log;
DROP POLICY IF EXISTS "water_log_delete_own" ON water_log;
CREATE POLICY "water_log_select_own" ON water_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "water_log_insert_own" ON water_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "water_log_delete_own" ON water_log FOR DELETE USING (auth.uid() = user_id);

-- ---------- weight_log ----------
DROP POLICY IF EXISTS "weight_log_select_own" ON weight_log;
DROP POLICY IF EXISTS "weight_log_insert_own" ON weight_log;
DROP POLICY IF EXISTS "weight_log_update_own" ON weight_log;
DROP POLICY IF EXISTS "weight_log_delete_own" ON weight_log;
CREATE POLICY "weight_log_select_own" ON weight_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "weight_log_insert_own" ON weight_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weight_log_update_own" ON weight_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "weight_log_delete_own" ON weight_log FOR DELETE USING (auth.uid() = user_id);

-- ---------- chat_log ----------
DROP POLICY IF EXISTS "chat_log_select_own" ON chat_log;
DROP POLICY IF EXISTS "chat_log_insert_own" ON chat_log;
DROP POLICY IF EXISTS "chat_log_delete_own" ON chat_log;
CREATE POLICY "chat_log_select_own" ON chat_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chat_log_insert_own" ON chat_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_log_delete_own" ON chat_log FOR DELETE USING (auth.uid() = user_id);

-- ---------- foods ----------
-- All authenticated users can SEE all foods (the shared 116 + everyone's customs).
-- Custom food create/update/delete is owner-scoped.
-- (Public seed foods have owner_id IS NULL and can't be modified by anyone except service_role.)
DROP POLICY IF EXISTS "foods_select_all" ON foods;
DROP POLICY IF EXISTS "foods_insert_authenticated" ON foods;
DROP POLICY IF EXISTS "foods_update_own" ON foods;
DROP POLICY IF EXISTS "foods_delete_own" ON foods;
CREATE POLICY "foods_select_all" ON foods FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "foods_insert_authenticated" ON foods FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "foods_update_own" ON foods FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "foods_delete_own" ON foods FOR DELETE USING (auth.uid() = owner_id);

-- ---------- usda_cache ----------
-- Shared cache, all authenticated users can read it. Only service_role writes.
DROP POLICY IF EXISTS "usda_cache_select_all" ON usda_cache;
CREATE POLICY "usda_cache_select_all" ON usda_cache FOR SELECT USING (auth.role() = 'authenticated');
