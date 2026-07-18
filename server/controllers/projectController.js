const supabase = require('../config/supabase');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');
const resolveStudioId = require('../utils/resolveStudioId');

exports.getProjects = async (req, res) => {
    try {
        const ownerId = await resolveStudioId(req.user.id);
        const { client_id, status } = req.query;
        const pagination = getPaginationParams(req.query);

        // Visibility is derived from the data, not from role metadata (robust):
        // a user sees the projects they OWN (studio) plus those of the client
        // records LINKED to their account (client).
        const { data: linked, error: linkError } = await supabase
            .from('clients')
            .select('id')
            .eq('user_id', req.user.id);
        if (linkError) throw linkError;
        const clientIds = (linked || []).map((c) => c.id);

        let query = supabase
            .from('projects')
            .select('*, client:clients(name, logo_url)', pagination.hasPagination ? { count: 'exact' } : undefined)
            .order('created_at', { ascending: false });

        if (clientIds.length) {
            query = query.or(`owner_id.eq.${ownerId},client_id.in.(${clientIds.join(',')})`);
        } else {
            query = query.eq('owner_id', ownerId);
        }

        if (client_id) query = query.eq('client_id', client_id);
        if (status) query = query.eq('status', status);
        if (pagination.hasPagination) query = query.range(pagination.from, pagination.to);

        const { data, error, count } = await query;
        if (error) throw error;

        const projectIds = (data || []).map(p => p.id);
        if (projectIds.length > 0) {
            const { data: reads } = await supabase
                .from('message_reads')
                .select('*')
                .in('project_id', projectIds)
                .eq('user_id', req.user.id);
            
            const { data: latestMessages } = await supabase
                .from('messages')
                .select('project_id, created_at, sender_id')
                .in('project_id', projectIds);

            (data || []).forEach(p => {
                const readRecord = reads?.find(r => r.project_id === p.id);
                const projectMessages = latestMessages?.filter(m => m.project_id === p.id) || [];
                if (!readRecord) {
                    p.has_unread = projectMessages.some(m => m.sender_id !== req.user.id);
                } else {
                    p.has_unread = projectMessages.some(m => m.sender_id !== req.user.id && new Date(m.created_at) > new Date(readRecord.last_read_at));
                }
            });
        }

        res.json(buildPaginatedResponse(data, count, pagination));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getProjectById = async (req, res) => {
    try {
        const ownerId = await resolveStudioId(req.user.id);
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
            .eq('owner_id', ownerId)
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
        const ownerId = await resolveStudioId(req.user.id);
        const { name, description, client_id, status, date } = req.body;

        const { data, error } = await supabase
            .from('projects')
            .insert([{
                name,
                description,
                client_id: client_id || null,
                status: status || 'pending',
                date: date || new Date().toISOString().split('T')[0],
                owner_id: ownerId,
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
        const ownerId = await resolveStudioId(req.user.id);
        const { data, error } = await supabase
            .from('projects')
            .update({ ...req.body, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .eq('owner_id', ownerId)
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
        const ownerId = await resolveStudioId(req.user.id);
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', req.params.id)
            .eq('owner_id', ownerId);

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
        const ownerId = await resolveStudioId(userId);

        const [projects, clients, tasks, pendingAssets] = await Promise.all([
            supabase.from('projects').select('*', { count: 'exact', head: true }).eq('owner_id', ownerId),
            supabase.from('clients').select('*', { count: 'exact', head: true }).eq('owner_id', ownerId),
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assigned_to', userId).eq('status', 'todo'),
            supabase.from('projects').select('*', { count: 'exact', head: true }).eq('owner_id', ownerId).eq('status', 'pending'),
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

exports.getProjectMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = await resolveStudioId(req.user.id);
        
        // 1. Fetch project to get owner_id and client_id
        const { data: project, error: projError } = await supabase
            .from('projects')
            .select('owner_id, client_id, client:clients(user_id)')
            .eq('id', id)
            .single();
            
        if (projError) throw projError;
        
        // We must return an array of members
        const members = [];
        
        // 2. Fetch Owner profile
        const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .eq('id', project.owner_id)
            .single();
        if (ownerProfile) members.push({ ...ownerProfile, type: 'owner' });
            
        // 3. Fetch Team Members
        const { data: teamMembers } = await supabase
            .from('team_members')
            .select('user:profiles!team_members_user_id_fkey(id, name, avatar_url)')
            .eq('studio_id', project.owner_id)
            .eq('status', 'active');
            
        if (teamMembers) {
            teamMembers.forEach(tm => {
                if (tm.user) {
                    members.push({ ...tm.user, type: 'team' });
                }
            });
        }
        
        // 4. Fetch Client Profile if accepted
        if (project.client?.user_id) {
            const { data: clientProfile } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .eq('id', project.client.user_id)
                .single();
            if (clientProfile) members.push({ ...clientProfile, type: 'client' });
        }
        
        // Remove duplicates just in case
        const uniqueMembers = Array.from(new Map(members.map(item => [item.id, item])).values());
        
        res.json(uniqueMembers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
