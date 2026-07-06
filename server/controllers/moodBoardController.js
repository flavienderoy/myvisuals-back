const supabase = require('../config/supabase');

// Get user's mood boards
exports.getMoodBoards = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('mood_boards')
            .select('*, assets:mood_board_assets(asset:assets(id, name, url, type))')
            .eq('owner_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMoodBoardById = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('mood_boards')
            .select('*, assets:mood_board_assets(asset:assets(*))')
            .eq('id', req.params.id)
            .eq('owner_id', req.user.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Mood board not found' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createMoodBoard = async (req, res) => {
    try {
        const { name, description } = req.body;
        const { data, error } = await supabase
            .from('mood_boards')
            .insert([{ name, description, owner_id: req.user.id }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateMoodBoard = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('mood_boards')
            .update(req.body)
            .eq('id', req.params.id)
            .eq('owner_id', req.user.id)
            .select();

        if (error) throw error;
        if (!data.length) return res.status(404).json({ error: 'Mood board not found' });
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteMoodBoard = async (req, res) => {
    try {
        const { error } = await supabase
            .from('mood_boards')
            .delete()
            .eq('id', req.params.id)
            .eq('owner_id', req.user.id);

        if (error) throw error;
        res.json({ message: 'Mood board deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add an asset to a mood board
exports.addAsset = async (req, res) => {
    try {
        const { asset_id } = req.body;
        const { data, error } = await supabase
            .from('mood_board_assets')
            .insert([{ mood_board_id: req.params.id, asset_id }])
            .select('*, asset:assets(*)');

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Remove an asset from a mood board
exports.removeAsset = async (req, res) => {
    try {
        const { error } = await supabase
            .from('mood_board_assets')
            .delete()
            .eq('mood_board_id', req.params.id)
            .eq('asset_id', req.params.assetId);

        if (error) throw error;
        res.json({ message: 'Asset removed from mood board' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
