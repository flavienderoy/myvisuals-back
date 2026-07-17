-- ================================================================
-- Migration 004 — Threaded annotations (replies)
-- ================================================================
-- An annotation pinned on an image can now receive replies, so the studio
-- and the client can discuss a specific retouch back and forth.
-- A reply has parent_id set and no x/y (it inherits its parent's position).
--
-- Run in the Supabase SQL editor. Idempotent.

ALTER TABLE public.annotations
    ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.annotations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_annotations_parent_id ON public.annotations (parent_id);
