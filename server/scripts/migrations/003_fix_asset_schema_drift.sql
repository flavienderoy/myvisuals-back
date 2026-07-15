-- ================================================================
-- Migration 003 — Reconcile assets/asset_versions with the live schema
-- ================================================================
-- The live database predates server/scripts/database_schema.sql and never had
-- file_path/position on `assets` or file_path on `asset_versions` — uploads
-- have been failing with "column does not exist" since before this pipeline
-- rework. The live table uses `owner_id` (not `uploaded_by`), which the
-- controller now uses directly instead of adding a duplicate column.
--
-- Run in the Supabase SQL editor. Idempotent.

ALTER TABLE public.assets
    ADD COLUMN IF NOT EXISTS file_path TEXT,
    ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

ALTER TABLE public.asset_versions
    ADD COLUMN IF NOT EXISTS file_path TEXT;

-- `url` used to store a permanent public URL; the app now mints short-lived
-- signed URLs on read instead, so a version can be created before any URL exists.
ALTER TABLE public.asset_versions ALTER COLUMN url DROP NOT NULL;
