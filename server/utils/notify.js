const supabase = require('../config/supabase');

/**
 * Sends a notification to project members.
 * @param {string} projectId 
 * @param {string} senderId 
 * @param {object} options
 * @param {string} options.type 'message', 'mention', 'status', 'annotation'
 * @param {string} options.title
 * @param {string} options.content
 * @param {string} options.link
 * @param {string[]} options.mentions Array of user IDs explicitly mentioned
 */
async function notifyProjectMembers(projectId, senderId, options) {
    try {
        const { type, title, content, link, mentions } = options;
        
        // Fetch project to get owner and client's user_id, and project name
        const { data: project } = await supabase
            .from('projects')
            .select('owner_id, client_id, name, client:clients(user_id)')
            .eq('id', projectId)
            .single();

        let memberIds = [];
        if (project) {
            if (project.client && project.client.user_id) {
                memberIds.push(project.client.user_id);
            }
            memberIds.push(project.owner_id);
            
            const { data: teamMembers } = await supabase
                .from('team_members')
                .select('user_id')
                .eq('studio_id', project.owner_id)
                .eq('status', 'active');
                
            if (teamMembers) {
                memberIds.push(...teamMembers.map(tm => tm.user_id));
            }
        }
        
        // Remove sender and nulls
        memberIds = [...new Set(memberIds)].filter(id => id && id !== senderId);
        console.log("notifyProjectMembers - memberIds:", memberIds);

        if (memberIds.length === 0) return;

        const { data: profiles, error: profErr } = await supabase
            .from('profiles')
            .select('id, notification_preferences')
            .in('id', memberIds);
            
        console.log("notifyProjectMembers - profiles:", profiles, "Error:", profErr);
            
        const notificationsToInsert = [];
        const isMentionList = (mentions && Array.isArray(mentions)) ? mentions : [];
        const projectName = project?.name || 'un projet';
        
        (profiles || []).forEach(profile => {
            const prefs = profile.notification_preferences || {};
            
            if (isMentionList.includes(profile.id)) {
                if (prefs.mentions_in_app !== false) {
                    notificationsToInsert.push({
                        user_id: profile.id,
                        type: 'mention',
                        message: `Nouvelle mention dans le projet : ${projectName}`,
                        project_id: projectId,
                        asset_id: options.asset_id || null
                    });
                }
            } else {
                // Check preferences for other types
                let shouldNotify = true;
                if (type === 'message' && prefs.messages_in_app === false) shouldNotify = false;
                if (type === 'status' && prefs.projects_in_app === false) shouldNotify = false;
                if (type === 'annotation' && prefs.projects_in_app === false) shouldNotify = false;
                
                if (shouldNotify) {
                    notificationsToInsert.push({
                        user_id: profile.id,
                        type: type,
                        message: content || `Notification du projet "${projectName}".`,
                        project_id: projectId,
                        asset_id: options.asset_id || null
                    });
                }
            }
        });
        
        console.log("NOTIFICATIONS TO INSERT:", notificationsToInsert);
        
        if (notificationsToInsert.length > 0) {
            const { error: insertErr } = await supabase.from('notifications').insert(notificationsToInsert);
            if (insertErr) {
                console.error("Error inserting notifications:", insertErr);
            } else {
                console.log("Successfully inserted notifications.");
            }
        }
    } catch (e) {
        console.error("Error in notifyProjectMembers:", e);
    }
}

module.exports = { notifyProjectMembers };
