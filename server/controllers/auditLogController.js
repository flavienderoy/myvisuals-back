const supabase = require('../config/supabase');

exports.getAuditLogs = async (req, res) => {
    try {
        const { resourceType, resourceId } = req.query;
        let query = supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (resourceType) query = query.eq('resource_type', resourceType);
        if (resourceId) query = query.eq('resource_id', resourceId);

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
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
