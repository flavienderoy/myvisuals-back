const supabase = require('../config/supabase');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');

exports.getClients = async (req, res) => {
    try {
        const pagination = getPaginationParams(req.query);

        let query = supabase
            .from('clients')
            .select('*', pagination.hasPagination ? { count: 'exact' } : undefined)
            .eq('owner_id', req.user.id)
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
        const { data, error } = await supabase
            .from('clients')
            .select('*, projects(*)')
            .eq('id', req.params.id)
            .eq('owner_id', req.user.id)
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
                owner_id: req.user.id,
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

        const { data, error } = await supabase
            .from('clients')
            .select('id, name, email, owner:profiles!clients_owner_id_fkey(name, organization), projects(count)')
            .eq('email', email)
            .is('user_id', null)
            .eq('invite_status', 'pending');

        if (error) throw error;
        res.json(data || []);
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
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateClient = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('clients')
            .update({ ...req.body, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .eq('owner_id', req.user.id)
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
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', req.params.id)
            .eq('owner_id', req.user.id);

        if (error) throw error;
        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
