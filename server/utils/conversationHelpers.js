const supabase = require('../config/supabase');

// Add participants (idempotent). rows = [{ user_id, role }]
async function addParticipants(conversationId, rows) {
    const payload = rows
        .filter((r) => r.user_id)
        .map((r) => ({ conversation_id: conversationId, user_id: r.user_id, role: r.role || 'member' }));
    if (!payload.length) return;
    await supabase.from('conversation_participants').upsert(payload, { onConflict: 'conversation_id,user_id' });
}

// The set of users who belong to a project: owner + linked client + active team
async function projectMemberIds(projectId) {
    const { data: project } = await supabase
        .from('projects')
        .select('owner_id, client:clients(user_id)')
        .eq('id', projectId)
        .single();
    if (!project) return { ownerId: null, ids: [] };

    const ids = [{ user_id: project.owner_id, role: 'admin' }];
    if (project.client?.user_id) ids.push({ user_id: project.client.user_id, role: 'member' });

    const { data: team } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('studio_id', project.owner_id)
        .eq('status', 'active');
    (team || []).forEach((t) => ids.push({ user_id: t.user_id, role: 'member' }));

    return { ownerId: project.owner_id, ids };
}

// Find or create the project channel, and (re)sync its participants.
async function ensureProjectChannel(projectId) {
    const { ownerId, ids } = await projectMemberIds(projectId);
    if (!ownerId) return null;

    let { data: convo } = await supabase
        .from('conversations')
        .select('id')
        .eq('project_id', projectId)
        .eq('type', 'project')
        .maybeSingle();

    if (!convo) {
        const { data: created, error } = await supabase
            .from('conversations')
            .insert([{ type: 'project', project_id: projectId, created_by: ownerId }])
            .select('id')
            .single();
        if (error) throw error;
        convo = created;
    }

    await addParticipants(convo.id, ids);
    return convo.id;
}

// Add a single user to every project channel they now belong to (client accept / team join)
async function addUserToProjectChannels(userId, projectIds) {
    for (const pid of projectIds) {
        try {
            const cid = await ensureProjectChannel(pid);
            if (cid) await addParticipants(cid, [{ user_id: userId, role: 'member' }]);
        } catch (e) {
            console.error('addUserToProjectChannels error:', e.message);
        }
    }
}

module.exports = { addParticipants, projectMemberIds, ensureProjectChannel, addUserToProjectChannels };
