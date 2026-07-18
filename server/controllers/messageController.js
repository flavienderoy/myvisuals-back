const supabase = require('../config/supabase');

// Get messages for a project and the read receipts
exports.getMessages = async (req, res) => {
    try {
        // 1. Fetch messages
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('project_id', req.params.projectId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // 2. Fetch sender profiles
        const senderIds = [...new Set((data || []).map((m) => m.sender_id).filter(Boolean))];
        let sendersById = {};
        if (senderIds.length) {
            const { data: profs } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .in('id', senderIds);
            sendersById = Object.fromEntries((profs || []).map((p) => [p.id, p]));
        }

        // 3. Fetch read receipts for this project
        const { data: reads } = await supabase
            .from('message_reads')
            .select('*')
            .eq('project_id', req.params.projectId);

        res.json({
            messages: (data || []).map((m) => ({ ...m, sender: sendersById[m.sender_id] || null })),
            reads: reads || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { content, file_url, file_name, file_size, file_type, reply_to_id, mentions } = req.body;

        const { data, error } = await supabase
            .from('messages')
            .insert([{
                project_id: req.params.projectId,
                sender_id: req.user.id,
                content: content || null,
                file_url: file_url || null,
                file_name: file_name || null,
                file_size: file_size || null,
                file_type: file_type || null,
                reply_to_id: reply_to_id || null
            }])
            .select('*');

        if (error) throw error;
        
        // Notify project members with the actual message excerpt (deep-linkable)
        const { notifyProjectMembers } = require('../utils/notify');
        await notifyProjectMembers(req.params.projectId, req.user.id, {
            type: 'message',
            content,
            mentions,
        });

        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Toggle an emoji reaction on a message
exports.toggleReaction = async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user.id;
        const { emoji } = req.body;

        if (!emoji) return res.status(400).json({ error: "Emoji required" });

        // Get current message
        const { data: msgData, error: fetchError } = await supabase
            .from('messages')
            .select('reactions')
            .eq('id', messageId)
            .single();

        if (fetchError || !msgData) throw fetchError || new Error("Message not found");

        let reactions = msgData.reactions || {};
        
        // Ensure reactions is an object
        if (typeof reactions !== 'object') reactions = {};

        // If the user already reacted with this emoji, remove it. Otherwise add/replace their reaction.
        if (reactions[userId] === emoji) {
            delete reactions[userId];
        } else {
            reactions[userId] = emoji;
        }

        const { data, error: updateError } = await supabase
            .from('messages')
            .update({ reactions })
            .eq('id', messageId)
            .select('*');

        if (updateError) throw updateError;
        res.json(data[0]);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Mark conversation as read
exports.markAsRead = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('message_reads')
            .upsert([{
                project_id: req.params.projectId,
                user_id: req.user.id,
                last_read_at: new Date().toISOString()
            }], { onConflict: 'project_id,user_id' })
            .select();

        if (error) throw error;
        res.status(200).json(data[0]);
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
