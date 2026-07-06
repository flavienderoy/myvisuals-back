const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const db = require('../../client/src/data/database.json');

async function seed(email) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === email);
    if (!user) {
        console.log("❌ Utilisateur introuvable. Crée d'abord un compte via l'app.");
        return;
    }
    const userId = user.id;

    console.log("📁 Migration pour :", email);
    const clientMap = {};
    const clients = [...new Set(db.projects.map(p => p.client))].filter(Boolean);
    for (const clientName of clients) {
        const { data } = await supabase.from('clients').insert([{ name: clientName, owner_id: userId }]).select();
        if (data) clientMap[clientName] = data[0].id;
    }

    for (const p of db.projects) {
        const { data: projData } = await supabase.from('projects').insert([{
            name: p.name, client_id: clientMap[p.client] || null, status: p.status, date: p.date, owner_id: userId
        }]).select();
        if(!projData) continue;
        const projectId = projData[0].id;
        console.log("   -", p.name);

        if (p.looks) {
            let pos=1;
            for(const l of p.looks){
                await supabase.from('looks').insert([{name: l.name, project_id: projectId, position: pos++}]);
            }
        }
    }
    console.log("✅ Données injectées avec succès ! Recharge ton navigateur.");
}

const args = process.argv.slice(2);
if (args[0]) seed(args[0]);
else console.log("Fournis l'adresse email de ton compte : node seed_from_email.js ton@email.com");
