-- Migration: add user accounts and link existing tables to users.
-- Additive only — no table drop/recreate. Existing rows get user_id = NULL
-- (un-owned) so current behavior keeps working before a login UI exists.
-- Run with:  psql -U postgres -d learnhub -f add_users_and_ownership.sql

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR NOT NULL UNIQUE,
    password_hash VARCHAR NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT now(),
    reset_token   VARCHAR,
    reset_expires TIMESTAMPTZ
);

-- 2. Ownership columns (nullable)
ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE notes       ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE documents   ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- 3. Notes uniqueness now includes user_id so two users can have notes for the
--    same course/day. (Dropping/adding a CONSTRAINT — not the table.)
ALTER TABLE notes DROP CONSTRAINT IF EXISTS uq_notes_course_day;
ALTER TABLE notes ADD CONSTRAINT uq_notes_user_course_day UNIQUE (user_id, course, day);
