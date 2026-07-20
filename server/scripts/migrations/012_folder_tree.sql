-- ================================================================
-- Migration 012 — Folder tree (nested folders for assets)
-- ================================================================
-- "Looks" become a folder tree: a folder can have a parent, so a project's
-- visuals can be organised in folders and sub-folders. Assets already
-- reference a folder via assets.look_id (SET NULL on delete → back to root).
--
-- Run in the Supabase SQL editor. Idempotent.

ALTER TABLE public.looks
    ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.looks(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_looks_parent_id ON public.looks (parent_id);
