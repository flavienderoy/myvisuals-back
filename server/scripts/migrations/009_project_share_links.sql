-- ================================================================
-- Migration 009 — Public share links
-- ================================================================
-- A studio can share a project read-only via a secret link, so third parties
-- (prestataires, investisseurs) can view the watermarked previews without an
-- account. Disabling revokes the link instantly.
--
-- Run in the Supabase SQL editor. Idempotent.

ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS share_token TEXT,
    ADD COLUMN IF NOT EXISTS share_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_projects_share_token ON public.projects (share_token);
