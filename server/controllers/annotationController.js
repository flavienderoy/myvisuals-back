const supabase = require('../config/supabase');

exports.getAnnotations = async (req, res) => {
    try {
        const { assetId, status } = req.query;
        let query = supabase.from('annotations').select('*').order('created_at', { ascending: true });
        
        if (assetId) {
            query = query.eq('asset_id', assetId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Enrich with author profiles
        const userIds = [...new Set(data.map(a => a.user_id).filter(Boolean))];
        let profilesMap = {};
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .in('id', userIds);
            profilesMap = (profiles || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
        }

        const enriched = data.map(a => ({
            ...a,
            author: profilesMap[a.user_id] ? {
                name: profilesMap[a.user_id].name,
                avatar_url: profilesMap[a.user_id].avatar_url,
            } : null,
        }));

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createAnnotation = async (req, res) => {
    try {
        const { asset_id, content, x_position, y_position, parent_id, version_id } = req.body;

        const insertPayload = {
                asset_id,
                user_id: req.user.id,
                content,
                // Replies inherit their parent's position, so x/y stay null
                x: parent_id ? null : x_position,
                y: parent_id ? null : y_position,
                parent_id: parent_id || null,
                // Which version the comment belongs to (null = the original image)
                version_id: version_id || null,
            };

        const { data, error } = await supabase
            .from('annotations')
            .insert([insertPayload])
            .select();

        if (error) throw error;

        // Attach author separately (no reliable FK embed for profiles)
        const { data: author } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('id', req.user.id)
            .single();

        // Notify the project members, deep-linking to this comment on the image
        try {
            const { data: asset } = await supabase
                .from('assets')
                .select('project_id')
                .eq('id', asset_id)
                .single();
            if (asset?.project_id) {
                const { notifyProjectMembers } = require('../utils/notify');
                await notifyProjectMembers(asset.project_id, req.user.id, {
                    type: 'annotation',
                    content,
                    assetId: asset_id,
                    // Deep-link to the root thread (a reply points at its parent)
                    annotationId: parent_id || data[0].id,
                    mentions: req.body.mentions,
                });
            }
        } catch (e) {
            console.error('annotation notify error:', e.message);
        }

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

exports.resolveAnnotation = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('annotations')
            .update({
                status: 'resolved',
                resolved_at: new Date().toISOString(),
                resolved_by: req.user.id,
            })
            .eq('id', req.params.id)
            .is('parent_id', null) // Only root annotations can be resolved
            .select();

        if (error) throw error;
        if (!data.length) return res.status(404).json({ error: 'Annotation not found or not a root ticket' });
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.reopenAnnotation = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('annotations')
            .update({
                status: 'open',
                resolved_at: null,
                resolved_by: null,
            })
            .eq('id', req.params.id)
            .is('parent_id', null)
            .select();

        if (error) throw error;
        if (!data.length) return res.status(404).json({ error: 'Annotation not found or not a root ticket' });
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTickets = async (req, res) => {
    try {
        const { status } = req.query;

        // Get all root annotations (tickets = annotations without parent_id)
        let query = supabase
            .from('annotations')
            .select('*')
            .is('parent_id', null)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data: tickets, error } = await query;
        if (error) throw error;

        if (!tickets || tickets.length === 0) {
            return res.json([]);
        }

        // Get reply counts for each ticket
        const ticketIds = tickets.map(t => t.id);
        const { data: replies } = await supabase
            .from('annotations')
            .select('parent_id')
            .in('parent_id', ticketIds);

        const replyCounts = (replies || []).reduce((acc, r) => {
            acc[r.parent_id] = (acc[r.parent_id] || 0) + 1;
            return acc;
        }, {});

        // Get asset info for each ticket
        const assetIds = [...new Set(tickets.map(t => t.asset_id).filter(Boolean))];
        let assetsMap = {};
        if (assetIds.length > 0) {
            const { data: assets } = await supabase
                .from('assets')
                .select('id, name, url, project_id')
                .in('id', assetIds);
            assetsMap = (assets || []).reduce((acc, a) => { acc[a.id] = a; return acc; }, {});
        }

        // Get project info
        const projectIds = [...new Set(Object.values(assetsMap).map(a => a.project_id).filter(Boolean))];
        let projectsMap = {};
        if (projectIds.length > 0) {
            const { data: projects } = await supabase
                .from('projects')
                .select('id, name')
                .in('id', projectIds);
            projectsMap = (projects || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
        }

        // Get author profiles
        const userIds = [...new Set(tickets.map(t => t.user_id).filter(Boolean))];
        let profilesMap = {};
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .in('id', userIds);
            profilesMap = (profiles || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
        }

        const enriched = tickets.map(t => {
            const asset = assetsMap[t.asset_id] || {};
            const project = projectsMap[asset.project_id] || {};
            return {
                ...t,
                reply_count: replyCounts[t.id] || 0,
                author: profilesMap[t.user_id] ? {
                    name: profilesMap[t.user_id].name,
                    avatar_url: profilesMap[t.user_id].avatar_url,
                } : null,
                asset_name: asset.name || null,
                asset_url: asset.url || null,
                project_name: project.name || null,
                project_id: asset.project_id || null,
            };
        });

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
