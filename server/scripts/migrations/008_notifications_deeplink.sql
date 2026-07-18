-- ================================================================
-- Migration 008 — Rich, deep-linkable notifications
-- ================================================================
-- Notifications now carry who triggered them (actor) and the exact comment
-- to open/highlight, so a notification can read "{actor} a commenté : …" and
-- deep-link straight to the image with the annotation highlighted.
--
-- Run in the Supabase SQL editor. Idempotent.

ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS annotation_id UUID REFERENCES public.annotations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON public.notifications (actor_id);
