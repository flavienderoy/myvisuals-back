-- ================================================================
-- Migration 011 — Multi-conversation messaging (channels, groups, DMs)
-- ================================================================
-- Messages move from being project-scoped to conversation-scoped. A
-- conversation is a project channel, a named group, or a 1:1 direct message.
-- Existing project messages are backfilled into an auto-created project channel.
--
-- Run in the Supabase SQL editor. Idempotent.

-- 1. Tables --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'group',              -- 'project' | 'group' | 'direct'
    title TEXT,                                       -- for groups (null for project/direct)
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,  -- nullable
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL  -- last activity
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',              -- 'admin' | 'member'
    last_read_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_conv_participant ON public.conversation_participants (conversation_id, user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON public.conversation_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_project ON public.conversations (project_id);

ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages (conversation_id);

-- 2. Backfill: one project channel per project --------------------
INSERT INTO public.conversations (type, title, project_id, created_by, updated_at)
SELECT 'project', NULL, p.id, p.owner_id, now()
FROM public.projects p
WHERE NOT EXISTS (
    SELECT 1 FROM public.conversations c WHERE c.project_id = p.id AND c.type = 'project'
);

-- Participants: studio owner (admin), linked client, active team members
INSERT INTO public.conversation_participants (conversation_id, user_id, role)
SELECT c.id, p.owner_id, 'admin'
FROM public.conversations c JOIN public.projects p ON p.id = c.project_id
WHERE c.type = 'project' AND p.owner_id IS NOT NULL
ON CONFLICT (conversation_id, user_id) DO NOTHING;

INSERT INTO public.conversation_participants (conversation_id, user_id, role)
SELECT c.id, cl.user_id, 'member'
FROM public.conversations c
JOIN public.projects p ON p.id = c.project_id
JOIN public.clients cl ON cl.id = p.client_id
WHERE c.type = 'project' AND cl.user_id IS NOT NULL
ON CONFLICT (conversation_id, user_id) DO NOTHING;

INSERT INTO public.conversation_participants (conversation_id, user_id, role)
SELECT c.id, tm.user_id, 'member'
FROM public.conversations c
JOIN public.projects p ON p.id = c.project_id
JOIN public.team_members tm ON tm.studio_id = p.owner_id AND tm.status = 'active'
WHERE c.type = 'project' AND tm.user_id IS NOT NULL
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- Link existing messages to their project channel
UPDATE public.messages m
SET conversation_id = c.id
FROM public.conversations c
WHERE c.project_id = m.project_id AND c.type = 'project' AND m.conversation_id IS NULL;
