const supabase = require('../config/supabase');
const crypto = require('crypto');

exports.getTeamMembers = async (req, res) => {
    try {
        let teamRows = [];
        const { data, error } = await supabase
            .from('team_members')
            .select(`
                id,
                role,
                status,
                created_at,
                user_id,
                user:profiles(id, email, name, avatar_url)
            `)
            .eq('studio_id', req.user.id);

        if (error) {
            const { data: rawMembers, error: rawError } = await supabase
                .from('team_members')
                .select('id, role, status, created_at, user_id')
                .eq('studio_id', req.user.id);

            if (rawError) throw rawError;

            const userIds = (rawMembers || []).map(m => m.user_id).filter(Boolean);
            let profileMap = {};
            if (userIds.length > 0) {
                const { data: userProfiles } = await supabase
                    .from('profiles')
                    .select('id, email, name, avatar_url')
                    .in('id', userIds);
                (userProfiles || []).forEach(p => { profileMap[p.id] = p; });
            }

            teamRows = (rawMembers || []).map(m => ({
                ...m,
                user: profileMap[m.user_id] || { id: m.user_id, email: '', name: 'Membre' }
            }));
        } else {
            teamRows = data || [];
        }

        const { data: ownerData } = await supabase
            .from('profiles')
            .select('id, email, name, avatar_url')
            .eq('id', req.user.id)
            .single();

        const ownerUser = ownerData || {
            id: req.user.id,
            email: req.user.email,
            name: req.user.user_metadata?.name || 'Propriétaire Studio',
            avatar_url: null
        };

        const members = [
            { id: 'owner', role: 'owner', status: 'active', user: ownerUser, created_at: new Date() },
            ...teamRows
        ];

        res.json(members);
    } catch (error) {
        console.error('getTeamMembers error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.inviteMember = async (req, res) => {
    try {
        const { email, role } = req.body;
        if (!email || !role) return res.status(400).json({ error: 'Email et rôle requis' });

        const trimmedEmail = email.trim().toLowerCase();

        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, name, avatar_url')
            .eq('email', trimmedEmail);

        if (profileError) throw profileError;

        let targetProfile = profiles?.length > 0 ? profiles[0] : null;

        if (!targetProfile) {
            return res.status(404).json({ error: "L'utilisateur doit déjà avoir un compte sur la plateforme pour être invité." });
        }

        if (targetProfile.id === req.user.id) {
            return res.status(400).json({ error: "Vous êtes déjà le propriétaire de cette équipe." });
        }

        const { data: existing } = await supabase
            .from('team_members')
            .select('id')
            .eq('studio_id', req.user.id)
            .eq('user_id', targetProfile.id);

        if (existing && existing.length > 0) {
            return res.status(400).json({ error: "Cet utilisateur est déjà dans l'équipe." });
        }

        const { data, error } = await supabase
            .from('team_members')
            .insert([{
                studio_id: req.user.id,
                user_id: targetProfile.id,
                role: role,
                status: 'active'
            }])
            .select('id, role, status, created_at, user_id')
            .single();

        if (error) throw error;

        const newMemberObj = {
            ...data,
            user: targetProfile
        };

        // Add the new member to the studio's project channels
        try {
            const { data: projects } = await supabase.from('projects').select('id').eq('owner_id', req.user.id);
            const { addUserToProjectChannels } = require('../utils/conversationHelpers');
            await addUserToProjectChannels(targetProfile.id, (projects || []).map((p) => p.id));
        } catch (e) {
            console.error('team channel sync error:', e.message);
        }

        res.status(201).json(newMemberObj);
    } catch (error) {
        console.error('inviteMember error:', error);
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
