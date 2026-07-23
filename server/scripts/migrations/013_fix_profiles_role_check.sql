-- ================================================================
-- Migration 013 — Update profiles role check constraint
-- ================================================================
-- Allows 'studio', 'client', 'admin', 'member', and 'owner' in profiles.role

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('studio', 'client', 'admin', 'member', 'owner'));
