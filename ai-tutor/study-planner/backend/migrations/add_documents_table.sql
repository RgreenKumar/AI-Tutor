-- Migration: add the `documents` table (uploaded files + extracted text).
-- Additive only — does not touch existing tables.
-- Run with:  psql -U postgres -d learnhub -f add_documents_table.sql

CREATE TABLE IF NOT EXISTS documents (
    id           SERIAL PRIMARY KEY,
    filename     VARCHAR NOT NULL,
    text_content TEXT NOT NULL,
    uploaded_at  TIMESTAMPTZ DEFAULT now()
);
