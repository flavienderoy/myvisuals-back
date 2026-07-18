-- ================================================================
-- Migration 010 — Asset tags
-- ================================================================
-- Free-form labels on assets (e.g. "Urgent", "V2", "Print") to filter large
-- projects.
--
-- Run in the Supabase SQL editor. Idempotent.

ALTER TABLE public.assets
    ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_assets_tags ON public.assets USING GIN (tags);
