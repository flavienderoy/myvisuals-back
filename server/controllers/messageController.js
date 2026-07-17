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

        // Attach sender profiles separately (no reliable FK embed for profiles)
        const senderIds = [...new Set((data || []).map((m) => m.sender_id).filter(Boolean))];
        let sendersById = {};
        if (senderIds.length) {
            const { data: profs } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .in('id', senderIds);
            sendersById = Object.fromEntries((profs || []).map((p) => [p.id, p]));
        }

        res.json((data || []).map((m) => ({ ...m, sender: sendersById[m.sender_id] || null })));
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
