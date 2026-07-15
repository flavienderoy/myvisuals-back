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
        const { text, opacity, position, image_url } = req.body;

        const payload = {
            text,
            opacity,
            position,
            image_url,
            updated_at: new Date().toISOString(),
        };

        // Single settings row (MVP): update the existing one, or insert if none.
        // (Avoids assuming a fixed id — the id column is a uuid.)
        const { data: existing } = await supabase
            .from('watermark_settings')
            .select('id')
            .limit(1)
            .maybeSingle();

        const result = existing
            ? await supabase.from('watermark_settings').update(payload).eq('id', existing.id).select()
            : await supabase.from('watermark_settings').insert([payload]).select();

        if (result.error) throw result.error;
        res.json(result.data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
