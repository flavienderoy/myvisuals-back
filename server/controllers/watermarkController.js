const supabase = require('../config/supabase');

// Get watermark settings for user
exports.getSettings = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('watermark_settings')
            .select('*')
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        res.json(data || { text: '', opacity: 0.3, position: 'center', size: 24, color: '#ffffff', enabled: false });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Upsert watermark settings
exports.saveSettings = async (req, res) => {
    try {
        const { text, opacity, position, size, color, enabled } = req.body;

        const { data, error } = await supabase
            .from('watermark_settings')
            .upsert({
                id: 1, // Global or single config for MVP
                text,
                opacity,
                position,
                size,
                color,
                enabled,
                updated_at: new Date().toISOString(),
            })
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
