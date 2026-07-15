const supabase = require('../config/supabase');

// Get messages for a project
exports.getMessages = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('project_id', req.params.projectId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { content } = req.body;

        const { data, error } = await supabase
            .from('messages')
            .insert([{
                project_id: req.params.projectId,
                sender_id: req.user.id,
                content,
            }])
            .select('*');

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a message (own messages only)
exports.deleteMessage = async (req, res) => {
    try {
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', req.params.id)
            .eq('sender_id', req.user.id);

        if (error) throw error;
        res.json({ message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
