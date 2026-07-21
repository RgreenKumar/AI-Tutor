-- Migration: add calendar `date` and `created_at` columns to study_plans.
-- Safe to run on an existing `learnhub` database (no drop/recreate).
-- Run with:  psql -U postgres -d learnhub -f add_date_and_created_at.sql

ALTER TABLE study_plans
    ADD COLUMN IF NOT EXISTS date DATE;

ALTER TABLE study_plans
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Backfill created_at for any rows that pre-date this column.
UPDATE study_plans
    SET created_at = now()
    WHERE created_at IS NULL;
