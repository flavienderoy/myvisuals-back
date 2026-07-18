const crypto = require('crypto');
const supabase = require('../config/supabase');

const BUCKET = 'assets';
const PREVIEW_TTL = 3600;

// Public, no-auth read-only view of a shared project (watermarked previews only).
exports.getSharedProject = async (req, res) => {
    try {
        const { token } = req.params;
        if (!token) return res.status(404).json({ error: 'Lien invalide' });

        const { data: project, error } = await supabase
            .from('projects')
            .select('id, name, description, share_enabled, owner_id')
            .eq('share_token', token)
            .maybeSingle();

        if (error) throw error;
        if (!project || !project.share_enabled) {
            return res.status(404).json({ error: 'Ce lien de partage n\'est plus actif.' });
        }

        // Studio identity (for branding the public page)
        const { data: studio } = await supabase
            .from('profiles')
            .select('name, organization, avatar_url')
            .eq('id', project.owner_id)
            .single();

        // Assets — watermarked previews only, never the original
        const { data: assets } = await supabase
            .from('assets')
            .select('id, name, status, preview_path, file_path, created_at')
            .eq('project_id', project.id)
            .order('position', { ascending: true });

        const items = await Promise.all(
            (assets || []).map(async (a) => {
                const path = a.preview_path || a.file_path;
                let url = null;
                if (path) {
                    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, PREVIEW_TTL);
                    url = data?.signedUrl || null;
                }
                return { id: a.id, name: a.name, status: a.status, url };
            })
        );

        res.json({
            project: { name: project.name, description: project.description },
            studio: {
                name: studio?.organization || studio?.name || 'Studio',
                avatar_url: studio?.avatar_url || null,
            },
            assets: items,
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// Studio-side: enable sharing (generates a token if needed) / disable (revokes).
exports.enableShare = async (req, res) => {
    try {
        const { data: project } = await supabase
            .from('projects')
            .select('id, share_token, owner_id')
            .eq('id', req.params.id)
            .eq('owner_id', req.user.id)
            .maybeSingle();

        if (!project) return res.status(404).json({ error: 'Projet introuvable' });

        const token = project.share_token || crypto.randomBytes(12).toString('base64url');
        const { error } = await supabase
            .from('projects')
            .update({ share_token: token, share_enabled: true, updated_at: new Date().toISOString() })
            .eq('id', project.id);
        if (error) throw error;

        res.json({ token, enabled: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.disableShare = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .update({ share_enabled: false, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .eq('owner_id', req.user.id)
            .select('id');
        if (error) throw error;
        if (!data.length) return res.status(404).json({ error: 'Projet introuvable' });
        res.json({ enabled: false });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
