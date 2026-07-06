const supabase = require('../config/supabase');

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, organization, avatar_url } = req.body;
        const { data, error } = await supabase
            .from('profiles')
            .update({
                name,
                organization,
                avatar_url,
                updated_at: new Date().toISOString(),
            })
            .eq('id', req.user.id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const filePath = `${req.user.id}/avatar.${file.mimetype.split('/')[1]}`;

        // Upload to avatars bucket (public)
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true,
            });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // Update profile with avatar URL
        const { data, error } = await supabase
            .from('profiles')
            .update({
                avatar_url: urlData.publicUrl,
                updated_at: new Date().toISOString(),
            })
            .eq('id', req.user.id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
