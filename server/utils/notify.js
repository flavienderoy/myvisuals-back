const supabase = require('../config/supabase');

// Trim a message to a short excerpt for the notification body.
const excerpt = (text, n = 90) => {
    if (!text) return '';
    const t = String(text).replace(/\s+/g, ' ').trim();
    return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

/**
 * Notify a project's members (studio owner, active team members, linked client)
 * — except the actor — about an event, with enough context to deep-link.
 *
 * @param {string} projectId
 * @param {string} actorId   - the user who triggered the event
 * @param {object} options
 * @param {'annotation'|'message'|'status'|'mention'} options.type
 * @param {string} options.content        - raw text; stored as a short excerpt
 * @param {string} [options.assetId]      - asset to open on click
 * @param {string} [options.annotationId] - comment/thread to highlight on click
 * @param {string[]} [options.mentions]   - explicitly mentioned user ids
 */
async function notifyProjectMembers(projectId, actorId, options) {
    try {
        const { type, content, assetId = null, annotationId = null, mentions } = options;

        const { data: project } = await supabase
            .from('projects')
            .select('owner_id, client:clients(user_id)')
            .eq('id', projectId)
            .single();
        if (!project) return;

        let memberIds = [project.owner_id, project.client?.user_id];
        const { data: team } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('studio_id', project.owner_id)
            .eq('status', 'active');
        if (team) memberIds.push(...team.map((t) => t.user_id));

        // Unique, drop nulls and the actor
        memberIds = [...new Set(memberIds)].filter((id) => id && id !== actorId);
        if (memberIds.length === 0) return;

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, notification_preferences')
            .in('id', memberIds);

        const mentionSet = new Set(Array.isArray(mentions) ? mentions : []);
        const body = excerpt(content);

        const rows = [];
        (profiles || []).forEach((profile) => {
            const prefs = profile.notification_preferences || {};
            const isMention = mentionSet.has(profile.id);

            // Respect per-user preferences
            if (isMention) {
                if (prefs.mentions_in_app === false) return;
            } else if (type === 'message' && prefs.messages_in_app === false) {
                return;
            } else if ((type === 'status' || type === 'annotation') && prefs.projects_in_app === false) {
                return;
            }

            rows.push({
                user_id: profile.id,
                actor_id: actorId,
                type: isMention ? 'mention' : type,
                message: body,
                project_id: projectId,
                asset_id: assetId,
                annotation_id: annotationId,
            });
        });

        if (rows.length) {
            await supabase.from('notifications').insert(rows);
        }
    } catch (e) {
        console.error('notifyProjectMembers error:', e.message);
    }
}

module.exports = { notifyProjectMembers };
