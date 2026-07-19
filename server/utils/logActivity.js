const supabase = require('../config/supabase');

/**
 * Record a project activity (best-effort; never blocks the request).
 * @param {string} projectId
 * @param {string} userId  - the actor
 * @param {object} opts
 * @param {string} opts.type        - one of ACTIVITY_TYPES (upload, comment, approve, reject, project_created…)
 * @param {string} opts.description - human phrase, e.g. 'a validé « Logo.png »'
 * @param {object} [opts.metadata]
 */
async function logActivity(projectId, userId, { type, description, metadata = {} }) {
    if (!projectId || !userId) return;
    try {
        await supabase.from('activities').insert([{
            project_id: projectId,
            user_id: userId,
            type,
            description,
            metadata,
        }]);
    } catch (e) {
        console.error('logActivity error:', e.message);
    }
}

module.exports = { logActivity };
