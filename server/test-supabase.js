require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testConnection() {
  console.log("Testing Supabase connection...");
  const { data, error } = await supabase.from('projects').select('count', { count: 'exact', head: true });
  if (error) {
    console.error("❌ Connection failed:", error.message);
  } else {
    console.log("✅ Connection successful! Database reached.");
  }
}
testConnection();
