const supabase = require('../config/supabase');
const { addParticipants } = require('../utils/conversationHelpers');

const excerpt = (t, n = 90) => {
    if (!t) return '';
    const s = String(t).replace(/\s+/g, ' ').trim();
    return s.length > n ? `${s.slice(0, n - 1)}…` : s;
};

async function isParticipant(conversationId, userId) {
    const { data } = await supabase
        .from('conversation_participants')
        .select('id, role')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .maybeSingle();
    return data || null;
}

async function attachProfiles(rows, ids) {
    if (!ids.length) return {};
    const { data } = await supabase.from('profiles').select('id, name, avatar_url').in('id', [...new Set(ids)]);
    return Object.fromEntries((data || []).map((p) => [p.id, p]));
}

// GET /conversations — my conversations, enriched for the sidebar
exports.getConversations = async (req, res) => {
    try {
        const uid = req.user.id;
        const { data: parts } = await supabase
            .from('conversation_participants')
            .select('conversation_id, last_read_at')
            .eq('user_id', uid);

        const convIds = (parts || []).map((p) => p.conversation_id);
        if (!convIds.length) return res.json([]);
        const lastReadByConv = Object.fromEntries((parts || []).map((p) => [p.conversation_id, p.last_read_at]));

        const { data: convos } = await supabase
            .from('conversations')
            .select('*, project:projects(name), participants:conversation_participants(user_id, role)')
            .in('id', convIds)
            .order('updated_at', { ascending: false });

        // Resolve participant profiles + last message + unread count
        const allUserIds = (convos || []).flatMap((c) => (c.participants || []).map((p) => p.user_id));
        const profiles = await attachProfiles(convos, allUserIds);

        const enriched = await Promise.all((convos || []).map(async (c) => {
            const { data: lastArr } = await supabase
                .from('messages')
                .select('content, sender_id, created_at, file_name')
                .eq('conversation_id', c.id)
                .order('created_at', { ascending: false })
                .limit(1);
            const last = lastArr?.[0] || null;

            const lastRead = lastReadByConv[c.id];
            let unreadQuery = supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', c.id)
                .neq('sender_id', uid);
            if (lastRead) unreadQuery = unreadQuery.gt('created_at', lastRead);
            const { count } = await unreadQuery;
            const unread = count || 0;

            return {
                ...c,
                participants: (c.participants || []).map((p) => ({ ...p, profile: profiles[p.user_id] || null })),
                lastMessage: last ? { ...last, preview: last.content ? excerpt(last.content, 60) : (last.file_name ? '📎 Pièce jointe' : '') } : null,
                unread,
            };
        }));

        res.json(enriched);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// GET /conversations/:id/messages
exports.getMessages = async (req, res) => {
    try {
        if (!(await isParticipant(req.params.id, req.user.id))) {
            return res.status(403).json({ error: 'Accès refusé' });
        }
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', req.params.id)
            .order('created_at', { ascending: true });
        if (error) throw error;

        const senders = await attachProfiles(data, (data || []).map((m) => m.sender_id));

        // Fetch participants' last_read_at to compute read receipts
        const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id, last_read_at')
            .eq('conversation_id', req.params.id);
        const otherReaders = (participants || []).filter((p) => p.user_id !== req.user.id && p.last_read_at);

        res.json((data || []).map((m) => ({
            ...m,
            sender: senders[m.sender_id] || null,
            read_by: otherReaders.filter((p) => new Date(p.last_read_at) >= new Date(m.created_at)).map((p) => p.user_id),
        })));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// POST /conversations/:id/messages
exports.sendMessage = async (req, res) => {
    try {
        if (!(await isParticipant(req.params.id, req.user.id))) {
            return res.status(403).json({ error: 'Accès refusé' });
        }
        const { content, file_url, file_name, file_size, file_type, reply_to_id, mentions } = req.body;

        const { data, error } = await supabase
            .from('messages')
            .insert([{
                conversation_id: req.params.id,
                sender_id: req.user.id,
                content: content || null,
                file_url: file_url || null,
                file_name: file_name || null,
                file_size: file_size || null,
                file_type: file_type || null,
                reply_to_id: reply_to_id || null,
            }])
            .select();
        if (error) throw error;

        // Bump conversation activity
        await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', req.params.id);

        // Notify the other participants
        await notifyConversation(req.params.id, req.user.id, content || (file_name ? 'a envoyé une pièce jointe' : ''), mentions);

        const { data: me } = await supabase.from('profiles').select('id, name, avatar_url').eq('id', req.user.id).single();
        res.status(201).json({ ...data[0], sender: me || null });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// POST /conversations/:id/read
exports.markRead = async (req, res) => {
    try {
        await supabase
            .from('conversation_participants')
            .update({ last_read_at: new Date().toISOString() })
            .eq('conversation_id', req.params.id)
            .eq('user_id', req.user.id);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// POST /conversations — create a group (studio) or use /direct for a DM
exports.createConversation = async (req, res) => {
    try {
        const role = req.user.user_metadata?.role;
        if (role === 'client') {
            return res.status(403).json({ error: 'Les clients ne peuvent créer que des messages directs' });
        }
        const { title, project_id, participantIds = [] } = req.body;

        const { data: convo, error } = await supabase
            .from('conversations')
            .insert([{ type: 'group', title: title || 'Nouveau groupe', project_id: project_id || null, created_by: req.user.id }])
            .select()
            .single();
        if (error) throw error;

        const rows = [{ user_id: req.user.id, role: 'admin' }, ...participantIds.map((id) => ({ user_id: id, role: 'member' }))];
        await addParticipants(convo.id, rows);

        res.status(201).json(convo);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// POST /conversations/direct — find or create a 1:1 with { userId }
exports.directConversation = async (req, res) => {
    try {
        const me = req.user.id;
        const other = req.body.userId;
        if (!other || other === me) return res.status(400).json({ error: 'Destinataire invalide' });

        // Existing direct conversation shared by both?
        const { data: mine } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', me);
        const myIds = (mine || []).map((r) => r.conversation_id);
        if (myIds.length) {
            const { data: shared } = await supabase
                .from('conversation_participants')
                .select('conversation_id, conversations!inner(type)')
                .eq('user_id', other)
                .in('conversation_id', myIds);
            const existing = (shared || []).find((r) => r.conversations?.type === 'direct');
            if (existing) return res.json({ id: existing.conversation_id });
        }

        const { data: convo, error } = await supabase
            .from('conversations')
            .insert([{ type: 'direct', created_by: me }])
            .select()
            .single();
        if (error) throw error;
        await addParticipants(convo.id, [{ user_id: me, role: 'member' }, { user_id: other, role: 'member' }]);
        res.status(201).json({ id: convo.id });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// PATCH /conversations/:id — rename / add / remove participants (group admin)
exports.updateConversation = async (req, res) => {
    try {
        const part = await isParticipant(req.params.id, req.user.id);
        if (!part) return res.status(403).json({ error: 'Accès refusé' });

        const { title, addIds = [], removeIds = [] } = req.body;
        if (title !== undefined) {
            await supabase.from('conversations').update({ title }).eq('id', req.params.id).eq('type', 'group');
        }
        if (addIds.length) await addParticipants(req.params.id, addIds.map((id) => ({ user_id: id, role: 'member' })));
        if (removeIds.length) {
            await supabase.from('conversation_participants').delete().eq('conversation_id', req.params.id).in('user_id', removeIds);
        }
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// GET /conversations/contacts — people I can start a DM / add to a group
// (everyone who shares at least one conversation with me)
exports.getContacts = async (req, res) => {
    try {
        const { data: mine } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', req.user.id);
        const convIds = (mine || []).map((r) => r.conversation_id);
        if (!convIds.length) return res.json([]);

        const { data: others } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .in('conversation_id', convIds)
            .neq('user_id', req.user.id);
        const uids = [...new Set((others || []).map((o) => o.user_id))];
        if (!uids.length) return res.json([]);

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, role')
            .in('id', uids);
        res.json(profiles || []);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// Insert an in-app notification for every other participant (respecting prefs)
async function notifyConversation(conversationId, actorId, content, mentions) {
    try {
        const { data: convo } = await supabase.from('conversations').select('project_id').eq('id', conversationId).single();
        const { data: parts } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conversationId)
            .neq('user_id', actorId);
        const ids = (parts || []).map((p) => p.user_id);
        if (!ids.length) return;

        const { data: profiles } = await supabase.from('profiles').select('id, notification_preferences').in('id', ids);
        const mentionSet = new Set(Array.isArray(mentions) ? mentions : []);
        const body = excerpt(content);

        const rows = [];
        (profiles || []).forEach((p) => {
            const prefs = p.notification_preferences || {};
            const isMention = mentionSet.has(p.id);
            if (isMention ? prefs.mentions_in_app === false : prefs.messages_in_app === false) return;
            rows.push({
                user_id: p.id,
                actor_id: actorId,
                type: isMention ? 'mention' : 'message',
                message: body,
                project_id: convo?.project_id || null,
            });
        });
        if (rows.length) await supabase.from('notifications').insert(rows);
    } catch (e) {
        console.error('notifyConversation error:', e.message);
    }
}
