const supabase = require('../config/supabase');
const { toWebp } = require('../utils/imageProcessor');

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

        // Avatars are always small — compress to WebP and cap at 512px.
        const processed = await toWebp(req.file, { quality: 85, maxWidth: 512 });
        const filePath = `${req.user.id}/avatar${processed.extension}`;

        // Upload to avatars bucket (public)
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, processed.buffer, {
                contentType: processed.mimetype,
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

// RGPD — Right to erasure (Art. 17): permanently delete the account and its data.
// Removes stored files, the profile row (cascades to app data via FK),
// then the Supabase Auth identity.
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Remove the user's uploaded assets from Storage
        const { data: assets } = await supabase
            .from('assets')
            .select('file_path')
            .eq('uploaded_by', userId);

        const assetPaths = (assets || []).map((a) => a.file_path).filter(Boolean);
        if (assetPaths.length) {
            await supabase.storage.from('assets').remove(assetPaths);
        }

        // 2. Remove the user's avatar folder from Storage
        const { data: avatarFiles } = await supabase.storage
            .from('avatars')
            .list(userId);
        if (avatarFiles?.length) {
            await supabase.storage
                .from('avatars')
                .remove(avatarFiles.map((f) => `${userId}/${f.name}`));
        }

        // 3. Delete the profile row (FK cascade removes projects, assets, messages…)
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);
        if (profileError) throw profileError;

        // 4. Delete the Auth identity (irreversible)
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) throw authError;

        res.json({ message: 'Account and associated data permanently deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
