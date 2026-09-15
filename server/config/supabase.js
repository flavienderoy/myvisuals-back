const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("⚠️ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in /server/.env");
}

// Côté serveur, aucune session utilisateur ne doit être conservée ni rafraîchie.
const createServerClient = () => createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseServiceKey || 'placeholder',
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
);

const supabase = createServerClient();

module.exports = supabase;
module.exports.createServerClient = createServerClient;
