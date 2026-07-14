const supabase = require('../config/supabase');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');

exports.getProjects = async (req, res) => {
    try {
        const { client_id, status } = req.query;
        const pagination = getPaginationParams(req.query);
        const role = req.user.user_metadata?.role || 'client';

        let query = supabase
            .from('projects')
            .select('*, client:clients(name, logo_url)', pagination.hasPagination ? { count: 'exact' } : undefined)
            .order('created_at', { ascending: false });

        if (role === 'client') {
            // A client sees the projects of the client records linked to their account
            const { data: linked, error: linkError } = await supabase
                .from('clients')
                .select('id')
                .eq('user_id', req.user.id);
            if (linkError) throw linkError;

            const clientIds = (linked || []).map((c) => c.id);
            if (clientIds.length === 0) {
                return res.json(buildPaginatedResponse([], 0, pagination));
            }
            query = query.in('client_id', clientIds);
        } else {
            // A studio sees the projects it owns
            query = query.eq('owner_id', req.user.id);
        }

        if (client_id) query = query.eq('client_id', client_id);
        if (status) query = query.eq('status', status);
        if (pagination.hasPagination) query = query.range(pagination.from, pagination.to);

        const { data, error, count } = await query;
        if (error) throw error;
        res.json(buildPaginatedResponse(data, count, pagination));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getProjectById = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select(`
                *,
                client:clients(name, logo_url),
                looks(id, name, position),
                assets(count),
                tasks(count)
            `)
            .eq('id', req.params.id)
            .eq('owner_id', req.user.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Project not found' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createProject = async (req, res) => {
    try {
        const { name, description, client_id, status, date } = req.body;

        const { data, error } = await supabase
            .from('projects')
            .insert([{
                name,
                description,
                client_id: client_id || null,
                status: status || 'pending',
                date: date || new Date().toISOString().split('T')[0],
                owner_id: req.user.id,
            }])
            .select('*, client:clients(name, logo_url)');

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .update({ ...req.body, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .eq('owner_id', req.user.id)
            .select('*, client:clients(name, logo_url)');

        if (error) throw error;
        if (!data.length) return res.status(404).json({ error: 'Project not found' });
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', req.params.id)
            .eq('owner_id', req.user.id);

        if (error) throw error;
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const [projects, clients, tasks, pendingAssets] = await Promise.all([
            supabase.from('projects').select('*', { count: 'exact', head: true }).eq('owner_id', userId),
            supabase.from('clients').select('*', { count: 'exact', head: true }).eq('owner_id', userId),
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assigned_to', userId).eq('status', 'todo'),
            supabase.from('projects').select('*', { count: 'exact', head: true }).eq('owner_id', userId).eq('status', 'pending'),
        ]);

        res.json({
            totalProjects: projects.count || 0,
            totalClients: clients.count || 0,
            pendingTasks: tasks.count || 0,
            pendingProjects: pendingAssets.count || 0,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
