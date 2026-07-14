const supabase = require('../config/supabase');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');

exports.getAuditLogs = async (req, res) => {
    try {
        const { resourceType, resourceId } = req.query;
        const pagination = getPaginationParams(req.query, { defaultLimit: 50 });

        let query = supabase
            .from('audit_logs')
            .select('*', pagination.hasPagination ? { count: 'exact' } : undefined)
            .order('created_at', { ascending: false });

        if (resourceType) query = query.eq('resource_type', resourceType);
        if (resourceId) query = query.eq('resource_id', resourceId);
        if (pagination.hasPagination) query = query.range(pagination.from, pagination.to);

        const { data, error, count } = await query;
        if (error) throw error;
        res.json(buildPaginatedResponse(data, count, pagination));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createAuditLog = async (req, res) => {
    try {
        const { action, resource_type, resource_id, details } = req.body;
        const { data, error } = await supabase
            .from('audit_logs')
            .insert([{
                action,
                resource_type,
                resource_id,
                details: details || {},
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
