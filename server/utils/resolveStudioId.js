const supabase = require('../config/supabase');

module.exports = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('team_members')
            .select('studio_id')
            .eq('user_id', userId)
            .eq('status', 'active');
            
        if (!error && data && data.length > 0) {
            return data[0].studio_id; // Employé
        }
    } catch (e) {
        console.error(e);
    }
    return userId; // Studio ou Client normal
};
