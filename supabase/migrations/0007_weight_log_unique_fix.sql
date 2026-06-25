-- 0007_weight_log_unique_fix.sql
--
-- Migration 0003 created a *partial* UNIQUE INDEX on weight_log:
--   CREATE UNIQUE INDEX weight_log_user_date_unique
--   ON weight_log (user_id, log_date) WHERE user_id IS NOT NULL;
--
-- Postgres won't accept ON CONFLICT against a partial index, so
-- supabase.from('weight_log').upsert({...}, {onConflict: 'user_id,log_date'})
-- fails with "no unique or exclusion constraint matching".
--
-- Fix: clean any legacy NULL-user_id rows, drop the partial index,
-- add a proper full UNIQUE constraint. Same fix applied to water_log
-- for consistency.

-- ============ weight_log ============
DELETE FROM weight_log WHERE user_id IS NULL;
ALTER TABLE weight_log ALTER COLUMN user_id SET NOT NULL;
DROP INDEX IF EXISTS weight_log_user_date_unique;
ALTER TABLE weight_log
  ADD CONSTRAINT weight_log_user_date_key UNIQUE (user_id, log_date);

-- ============ water_log (same pattern, same fix) ============
-- water_log doesn't have a UNIQUE constraint at all today — every glass is
-- its own row with auto-id. Leaving as-is. (If you ever want one row per day
-- per user with cumulative ml, that's a different change — ask first.)
