-- ================================================================
-- Migration 007 — Per-user notification preferences
-- ================================================================
-- Granular in-app notification toggles, stored as JSON on the profile
-- (e.g. { "mentions_in_app": true, "messages_in_app": true, "projects_in_app": true }).
--
-- Run in the Supabase SQL editor. Idempotent.

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS notification_preferences JSONB
        DEFAULT '{"mentions_in_app": true, "messages_in_app": true, "projects_in_app": true}'::jsonb;
