const supabase = require('../config/supabase');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');
const resolveStudioId = require('../utils/resolveStudioId');

exports.getClients = async (req, res) => {
    try {
        const ownerId = await resolveStudioId(req.user.id);
        const pagination = getPaginationParams(req.query);

        let query = supabase
            .from('clients')
            .select('*', pagination.hasPagination ? { count: 'exact' } : undefined)
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false });

        if (pagination.hasPagination) query = query.range(pagination.from, pagination.to);

        const { data, error, count } = await query;
        if (error) throw error;
        res.json(buildPaginatedResponse(data, count, pagination));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getClientById = async (req, res) => {
    try {
        const ownerId = await resolveStudioId(req.user.id);
        const { data, error } = await supabase
            .from('clients')
            .select('*, projects(*)')
            .eq('id', req.params.id)
            .eq('owner_id', ownerId)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Client not found' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createClient = async (req, res) => {
    try {
        const ownerId = await resolveStudioId(req.user.id);
        const { name, description, logo_url, avatar_url, email } = req.body;
        const { data, error } = await supabase
            .from('clients')
            .insert([{
                name,
                description,
                logo_url,
                avatar_url,
                email: email ? email.trim().toLowerCase() : null,
                invite_status: 'pending',
                owner_id: ownerId,
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Client portal — pending invitations addressed to the logged-in user's email
exports.getMyInvitations = async (req, res) => {
    try {
        const email = req.user.email?.toLowerCase();
        if (!email) return res.json([]);

        const { data: invites, error } = await supabase
            .from('clients')
            .select('id, name, email, owner_id')
            .eq('email', email)
            .is('user_id', null)
            .eq('invite_status', 'pending');

        if (error) throw error;
        if (!invites || invites.length === 0) return res.json([]);

        // Resolve the inviting studio's name separately (robust to embed/FK quirks)
        const ownerIds = [...new Set(invites.map((i) => i.owner_id).filter(Boolean))];
        let ownersById = {};
        if (ownerIds.length) {
            const { data: owners } = await supabase
                .from('profiles')
                .select('id, name, organization')
                .in('id', ownerIds);
            ownersById = Object.fromEntries((owners || []).map((o) => [o.id, o]));
        }

        res.json(invites.map((i) => ({
            id: i.id,
            name: i.name,
            email: i.email,
            owner: ownersById[i.owner_id] || null,
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Client portal — accept an invitation: link this client record to the user
exports.acceptInvitation = async (req, res) => {
    try {
        const email = req.user.email?.toLowerCase();

        // Only allow claiming a record that was invited to *this* user's email
        const { data: client, error: fetchError } = await supabase
            .from('clients')
            .select('id, email, user_id')
            .eq('id', req.params.id)
            .single();

        if (fetchError || !client) {
            return res.status(404).json({ error: 'Invitation not found' });
        }
        if (client.user_id) {
            return res.status(409).json({ error: 'Invitation already accepted' });
        }
        if (!client.email || client.email.toLowerCase() !== email) {
            return res.status(403).json({ error: 'This invitation is addressed to another email' });
        }

        const { data, error } = await supabase
            .from('clients')
            .update({ user_id: req.user.id, invite_status: 'accepted', updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select();

        if (error) throw error;

        // Add the client to the conversation channels of the projects they now access
        try {
            const { data: projects } = await supabase.from('projects').select('id').eq('client_id', req.params.id);
            const { addUserToProjectChannels } = require('../utils/conversationHelpers');
            await addUserToProjectChannels(req.user.id, (projects || []).map((p) => p.id));
        } catch (e) {
            console.error('client channel sync error:', e.message);
        }

        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateClient = async (req, res) => {
    try {
        const ownerId = await resolveStudioId(req.user.id);
        const { data, error } = await supabase
            .from('clients')
            .update({ ...req.body, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .eq('owner_id', ownerId)
            .select();

        if (error) throw error;
        if (!data.length) return res.status(404).json({ error: 'Client not found' });
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteClient = async (req, res) => {
    try {
        const ownerId = await resolveStudioId(req.user.id);
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', req.params.id)
            .eq('owner_id', ownerId);

        if (error) throw error;
        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
