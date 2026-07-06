const supabase = require('../config/supabase');

// Get looks for a project
exports.getLooks = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('looks')
            .select('*, assets(count)')
            .eq('project_id', req.params.projectId)
            .order('position', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createLook = async (req, res) => {
    try {
        const { name, position } = req.body;
        const { data, error } = await supabase
            .from('looks')
            .insert([{
                name,
                project_id: req.params.projectId,
                position: position || 0,
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateLook = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('looks')
            .update(req.body)
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        if (!data.length) return res.status(404).json({ error: 'Look not found' });
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteLook = async (req, res) => {
    try {
        const { error } = await supabase
            .from('looks')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Look deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reorder looks
exports.reorderLooks = async (req, res) => {
    try {
        const { looks } = req.body; // [{id, position}, ...]

        const updates = looks.map(({ id, position }) =>
            supabase.from('looks').update({ position }).eq('id', id)
        );

        await Promise.all(updates);
        res.json({ message: 'Looks reordered' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
