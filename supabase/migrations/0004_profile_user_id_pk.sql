-- =====================================================================
-- Migration 0004: Make profile.user_id the primary key
-- =====================================================================
-- Migration 0003 dropped the old profile.id PK constraint but left the
-- `id INTEGER` column with its inherited NOT NULL. That blocks inserts
-- (any new user signing up would hit "null value in column id violates
-- not-null constraint").
--
-- This migration:
--   1. Drops the now-useless integer `id` column
--   2. Promotes `user_id` to PRIMARY KEY
--   3. Ensures user_id is NOT NULL
-- =====================================================================

-- Drop the obsolete integer id column
ALTER TABLE profile DROP COLUMN IF EXISTS id;

-- Make user_id the primary key (will also enforce NOT NULL + UNIQUE)
ALTER TABLE profile ALTER COLUMN user_id SET NOT NULL;
-- Drop the partial unique index we created in 0003; PK gives us a proper one
DROP INDEX IF EXISTS profile_user_id_unique;
-- Add the proper primary key
ALTER TABLE profile DROP CONSTRAINT IF EXISTS profile_pkey;
ALTER TABLE profile ADD CONSTRAINT profile_pkey PRIMARY KEY (user_id);
