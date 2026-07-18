-- ================================================================
-- Migration 005 — Annotation tickets (resolve / reopen)
-- ================================================================
-- Each root annotation (a pin) is a ticket that can be resolved once the
-- requested change is done, then reopened. Replies (parent_id set) are never
-- tickets. Figma/Webflow-style commenting.
--
-- Run in the Supabase SQL editor. Idempotent.

ALTER TABLE public.annotations
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open',   -- 'open' | 'resolved'
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_annotations_status ON public.annotations (status);
