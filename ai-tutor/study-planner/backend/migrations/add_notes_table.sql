-- Migration: add the `notes` table (notes + AI summary per study-plan day).
-- Additive only — does not touch existing tables.
-- Run with:  psql -U postgres -d learnhub -f add_notes_table.sql

CREATE TABLE IF NOT EXISTS notes (
    id         SERIAL PRIMARY KEY,
    course     VARCHAR NOT NULL,
    day        INTEGER NOT NULL,
    content    TEXT NOT NULL,
    ai_summary TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_notes_course_day UNIQUE (course, day)
);
