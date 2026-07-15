-- ================================================================
-- Migration 002 — Secure asset pipeline (watermarked previews)
-- ================================================================
-- Each asset now stores TWO renditions in the private `assets` bucket:
--   • file_path    → the original HD file (never exposed to clients)
--   • preview_path → a downscaled, watermark-burned preview (what is displayed)
-- Images are served exclusively through short-lived signed URLs; the original
-- is only delivered via the authorized /download endpoint.
--
-- Run in the Supabase SQL editor. Idempotent.

ALTER TABLE public.assets
    ADD COLUMN IF NOT EXISTS file_size BIGINT,
    ADD COLUMN IF NOT EXISTS mime_type TEXT,
    ADD COLUMN IF NOT EXISTS preview_path TEXT;

ALTER TABLE public.asset_versions
    ADD COLUMN IF NOT EXISTS preview_path TEXT;

-- Reminder: keep the `assets` storage bucket PRIVATE (public = false).
-- Access is granted only through signed URLs minted by the API.
