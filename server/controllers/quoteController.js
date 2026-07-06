const supabase = require('../config/supabase');

// Get quotes
exports.getQuotes = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('quotes')
            .select('*, client:clients(name), project:projects(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getQuoteById = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('quotes')
            .select('*, client:clients(name, logo_url), project:projects(name)')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Quote not found' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createQuote = async (req, res) => {
    try {
        const { title, client_id, project_id, items, total, notes, valid_until } = req.body;

        const { data, error } = await supabase
            .from('quotes')
            .insert([{
                title,
                client_id,
                project_id,
                items: items || [],
                total: total || 0,
                notes,
                valid_until,
                status: 'draft',
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateQuote = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('quotes')
            .update({ ...req.body, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        if (!data.length) return res.status(404).json({ error: 'Quote not found' });
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteQuote = async (req, res) => {
    try {
        const { error } = await supabase
            .from('quotes')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Quote deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
