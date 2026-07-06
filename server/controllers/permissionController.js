const supabase = require('../config/supabase');

exports.getPermissions = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('permissions')
            .select('*');
            // Normally filter by project or organization.

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.setPermission = async (req, res) => {
    try {
        const { resource_type, resource_id, user_id, access_level } = req.body;
        const { data, error } = await supabase
            .from('permissions')
            .upsert([{
                resource_type,
                resource_id,
                user_id,
                access_level,
                granted_by: req.user.id
            }], { onConflict: 'resource_type,resource_id,user_id' })
            .select();

        if (error) throw error;
        res.status(200).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.revokePermission = async (req, res) => {
    try {
        const { resource_type, resource_id, user_id } = req.body;
        const { error } = await supabase
            .from('permissions')
            .delete()
            .match({ resource_type, resource_id, user_id });

        if (error) throw error;
        res.json({ message: 'Permission revoked successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
