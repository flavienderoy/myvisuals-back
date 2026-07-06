const supabase = require('../config/supabase');

// Get tasks for a project or assigned to user
exports.getTasks = async (req, res) => {
    try {
        const { projectId } = req.query;

        let query = supabase
            .from('tasks')
            .select('*, project:projects(name)')
            .order('created_at', { ascending: false });

        if (projectId) {
            query = query.eq('project_id', projectId);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createTask = async (req, res) => {
    try {
        const { title, description, project_id, assigned_to, priority, due_date } = req.body;

        const { data, error } = await supabase
            .from('tasks')
            .insert([{
                title,
                description,
                project_id,
                assigned_to: assigned_to || req.user.id,
                priority: priority || 'medium',
                due_date,
                status: 'todo',
            }])
            .select('*, project:projects(name)');

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .update({ ...req.body, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select('*, project:projects(name)');

        if (error) throw error;
        if (!data.length) return res.status(404).json({ error: 'Task not found' });
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
