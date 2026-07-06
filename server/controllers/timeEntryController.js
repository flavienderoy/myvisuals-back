const supabase = require('../config/supabase');

// Get time entries for user
exports.getTimeEntries = async (req, res) => {
    try {
        const { projectId, startDate, endDate } = req.query;

        let query = supabase
            .from('time_entries')
            .select('*, project:projects(name)')
            .eq('user_id', req.user.id)
            .order('date', { ascending: false });

        if (projectId) query = query.eq('project_id', projectId);
        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createTimeEntry = async (req, res) => {
    try {
        const { project_id, duration, description, date } = req.body;
        const { data, error } = await supabase
            .from('time_entries')
            .insert([{
                project_id,
                user_id: req.user.id,
                duration,
                description,
                date: date || new Date().toISOString().split('T')[0],
            }])
            .select('*, project:projects(name)');

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateTimeEntry = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('time_entries')
            .update(req.body)
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select('*, project:projects(name)');

        if (error) throw error;
        if (!data.length) return res.status(404).json({ error: 'Time entry not found' });
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteTimeEntry = async (req, res) => {
    try {
        const { error } = await supabase
            .from('time_entries')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ message: 'Time entry deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
