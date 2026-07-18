-- ================================================================
-- Migration 006 — Studio team members
-- ================================================================
-- A studio (identified by the owner's profile id) can invite collaborators.
-- studio_id = the owner's profile id; user_id = the collaborator's profile.
--
-- Run in the Supabase SQL editor. Idempotent.

CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    studio_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,   -- the studio owner
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,              -- the collaborator
    role TEXT NOT NULL DEFAULT 'member',   -- 'owner' | 'admin' | 'member' | 'client'
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'pending'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_team_members_studio_id ON public.team_members (studio_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_team_member ON public.team_members (studio_id, user_id);
