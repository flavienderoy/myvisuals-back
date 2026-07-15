const supabase = require('../config/supabase');

exports.getSmartFolders = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('smart_folders')
            .select('*')
            .eq('owner_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createSmartFolder = async (req, res) => {
    try {
        const { name, filters } = req.body;
        const { data, error } = await supabase
            .from('smart_folders')
            .insert([{
                name,
                filters: filters || {},
                owner_id: req.user.id,
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateSmartFolder = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('smart_folders')
            .update({ ...req.body, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        if (!data.length) return res.status(404).json({ error: 'Folder not found' });
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteSmartFolder = async (req, res) => {
    try {
        const { error } = await supabase
            .from('smart_folders')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Folder deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
