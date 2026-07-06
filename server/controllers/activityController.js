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
        res.json(data);
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
