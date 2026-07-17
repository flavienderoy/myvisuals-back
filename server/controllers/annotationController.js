const supabase = require('../config/supabase');

exports.getAnnotations = async (req, res) => {
    try {
        const { assetId } = req.query;
        let query = supabase.from('annotations').select('*').order('created_at', { ascending: true });
        
        if (assetId) {
            query = query.eq('asset_id', assetId);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createAnnotation = async (req, res) => {
    try {
        const { asset_id, content, x_position, y_position, parent_id } = req.body;

        const { data, error } = await supabase
            .from('annotations')
            .insert([{
                asset_id,
                user_id: req.user.id,
                content,
                // Replies inherit their parent's position, so x/y stay null
                x: parent_id ? null : x_position,
                y: parent_id ? null : y_position,
                parent_id: parent_id || null,
            }])
            .select();

        if (error) throw error;

        // Attach author separately (no reliable FK embed for profiles)
        const { data: author } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('id', req.user.id)
            .single();

        res.status(201).json({ ...data[0], timestamp: data[0].created_at, author: author || null });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateAnnotation = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('annotations')
            .update({ ...req.body, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id) // Ensure user owns it or check roles
            .select();

        if (error) throw error;
        if (!data.length) return res.status(404).json({ error: 'Annotation not found or unauthorized' });
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteAnnotation = async (req, res) => {
    try {
        const { error } = await supabase
            .from('annotations')
            .delete()
            .eq('id', req.params.id);
            // Optionally add role check for who can delete

        if (error) throw error;
        res.json({ message: 'Annotation deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
