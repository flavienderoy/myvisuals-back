-- ================================================================
-- Migration 001 — Client ↔ Studio linking (invitation by email)
-- ================================================================
-- A studio invites a client by email. The client account is linked to
-- the studio's client record only after the client explicitly accepts.
--
-- Run in the Supabase SQL editor (or psql) against the project database.
-- Idempotent: safe to run more than once.

ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS invite_status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Fast lookup of a client's pending invitations by their email,
-- and of the projects a linked client can see (by user_id).
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients (lower(email));
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients (user_id);

-- invite_status is 'pending' until the invited client accepts, then 'accepted'.
-- (Access is enforced in the API layer via the service role; RLS policies can be
--  added later to also allow linked clients to read their own rows directly.)
