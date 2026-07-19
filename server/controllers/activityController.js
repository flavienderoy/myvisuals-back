const supabase = require('../config/supabase');

// Get activities for a project
exports.getActivities = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { limit } = req.query;

        let query = supabase
            .from('activities')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (limit) query = query.limit(parseInt(limit));

        const { data, error } = await query;
        if (error) throw error;

        // Attach the actor (name/avatar) — resolved separately (no reliable embed)
        const userIds = [...new Set((data || []).map((a) => a.user_id).filter(Boolean))];
        let byId = {};
        if (userIds.length) {
            const { data: profs } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .in('id', userIds);
            byId = Object.fromEntries((profs || []).map((p) => [p.id, p]));
        }

        res.json((data || []).map((a) => ({ ...a, actor: a.user_id ? byId[a.user_id] || null : null })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create activity (usually called internally)
exports.createActivity = async (req, res) => {
    try {
        const { project_id, type, description, metadata } = req.body;
        const { data, error } = await supabase
            .from('activities')
            .insert([{
                project_id,
                user_id: req.user.id,
                type,
                description,
                metadata: metadata || {},
            }])
            .select('*');

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
