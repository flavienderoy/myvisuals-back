const supabase = require('../config/supabase');
const crypto = require('crypto');

exports.getTeamMembers = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('team_members')
            .select(`
                id,
                role,
                status,
                created_at,
                user:profiles!team_members_user_id_fkey(id, email, name, avatar_url)
            `)
            .eq('studio_id', req.user.id);

        if (error) throw error;
        
        const { data: ownerData } = await supabase
            .from('profiles')
            .select('id, email, name, avatar_url')
            .eq('id', req.user.id)
            .single();
            
        const members = [
            { id: 'owner', role: 'owner', status: 'active', user: ownerData, created_at: new Date() },
            ...(data || [])
        ];

        res.json(members);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.inviteMember = async (req, res) => {
    try {
        const { email, role } = req.body;
        if (!email || !role) return res.status(400).json({ error: 'Email et rôle requis' });

        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email);
            
        if (profileError) throw profileError;

        let userId = profiles?.length > 0 ? profiles[0].id : null;

        if (!userId) {
            return res.status(404).json({ error: 'L\'utilisateur doit déjà avoir un compte sur la plateforme pour être invité.' });
        }

        const { data: existing } = await supabase
            .from('team_members')
            .select('id')
            .eq('studio_id', req.user.id)
            .eq('user_id', userId);

        if (existing && existing.length > 0) {
            return res.status(400).json({ error: 'Cet utilisateur est déjà dans l\'équipe.' });
        }

        const { data, error } = await supabase
            .from('team_members')
            .insert([{
                studio_id: req.user.id,
                user_id: userId,
                role: role,
                status: 'active'
            }])
            .select(`
                id,
                role,
                status,
                created_at,
                user:profiles!team_members_user_id_fkey(id, email, name, avatar_url)
            `)
            .single();

        if (error) throw error;

        // Add the new member to the studio's project channels
        try {
            const { data: projects } = await supabase.from('projects').select('id').eq('owner_id', req.user.id);
            const { addUserToProjectChannels } = require('../utils/conversationHelpers');
            await addUserToProjectChannels(userId, (projects || []).map((p) => p.id));
        } catch (e) {
            console.error('team channel sync error:', e.message);
        }

        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        const { data, error } = await supabase
            .from('team_members')
            .update({ role })
            .eq('id', id)
            .eq('studio_id', req.user.id)
            .select(`
                id,
                role,
                status,
                created_at,
                user:profiles!team_members_user_id_fkey(id, email, name, avatar_url)
            `)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.removeMember = async (req, res) => {
    try {
        const { id } = req.params;
        
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', id)
            .eq('studio_id', req.user.id);

        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMyStudio = async (req, res) => {
    try {
        const { data: teamData, error: teamError } = await supabase
            .from('team_members')
            .select('studio_id, role, studio:profiles!team_members_studio_id_fkey(id, name, organization, avatar_url)')
            .eq('user_id', req.user.id)
            .eq('status', 'active');
            
        if (teamError) throw teamError;
        
        if (teamData && teamData.length > 0) {
            return res.json({
                isOwner: false,
                role: teamData[0].role,
                studio_id: teamData[0].studio_id,
                studio: teamData[0].studio
            });
        }
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, name, organization, avatar_url, role')
            .eq('id', req.user.id)
            .single();
            
        if (profile?.role === 'studio') {
            return res.json({
                isOwner: true,
                role: 'owner',
                studio_id: req.user.id,
                studio: profile
            });
        }
        
        res.json(null);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
