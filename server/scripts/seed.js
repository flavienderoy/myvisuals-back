const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const db = require('../../client/src/data/database.json');

async function seed() {
    console.log("🌱 Starting Database Seed migration...");
    const email = 'demo@visuals.co';
    let user;

    // 1. Create or fetch User
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const foundUser = existingUser.users.find(u => u.email === email);

    if (foundUser) {
        console.log("👤 User already exists:", foundUser.email);
        user = foundUser;
    } else {
        console.log("👤 Creating user demo@visuals.co...");
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password: 'password123',
            email_confirm: true,
            user_metadata: { name: db.currentUser.name, role: db.currentUser.role }
        });
        if (error) {
            console.error("❌ Error creating user:", error);
            return;
        }
        user = data.user;
        console.log("✅ User created successfully!");
        
        // Wait 1 sec for postgres trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update Profile details
        await supabase.from('profiles').update({
            name: db.currentUser.name,
            organization: 'Anti-Gravity Studio'
        }).eq('id', user.id);
    }

    const userId = user.id;

    // 2. Clients
    console.log("\n🏢 Migrating Clients...");
    const clientMap = {};
    const clients = [...new Set(db.projects.map(p => p.client))].filter(Boolean);
    for (const clientName of clients) {
        const { data } = await supabase.from('clients').insert([{
            name: clientName,
            owner_id: userId
        }]).select();
        if (data && data.length) {
            clientMap[clientName] = data[0].id;
            console.log(`   - ${clientName}`);
        }
    }

    // 3. Projects
    console.log("\n📁 Migrating Projects & Assets...");
    for (const p of db.projects) {
        const { data: projData, error } = await supabase.from('projects').insert([{
            name: p.name,
            client_id: clientMap[p.client] || null,
            description: p.description || '',
            status: p.status,
            date: p.date,
            owner_id: userId
        }]).select();
        
        if (error || !projData) {
            console.error("Error inserting project:", p.name, error);
            continue;
        }
        const projectId = projData[0].id;
        console.log(`   - Project: ${p.name}`);

        // 4. Looks
        const lookMap = {};
        if (p.looks) {
            let pos = 1;
            for (const l of p.looks) {
                const { data: lookData } = await supabase.from('looks').insert([{
                    name: l.name,
                    project_id: projectId,
                    position: pos++
                }]).select();
                if(lookData) lookMap[l.id] = lookData[0].id;
            }
        }

        // 5. Assets, Versions & Annotations
        if (p.assets) {
            let pos = 1;
            for (const a of p.assets) {
                const latestVersion = a.versions?.[a.versions.length - 1];
                const file_path = `${userId}/${projectId}/${a.id}.jpg`;
                
                const { data: assetData } = await supabase.from('assets').insert([{
                    name: a.name,
                    project_id: projectId,
                    look_id: lookMap[a.lookId] || null,
                    status: a.status,
                    url: latestVersion?.url || a.thumbnail || 'https://via.placeholder.com/800',
                    type: latestVersion?.type || 'raw',
                    file_path: file_path,
                    position: pos++,
                    uploaded_by: userId
                }]).select();
                
                if (!assetData) continue;
                const assetId = assetData[0].id;

                // Versions
                if (a.versions) {
                    for (const v of a.versions) {
                        await supabase.from('asset_versions').insert([{
                            asset_id: assetId,
                            version_number: v.version,
                            url: v.url,
                            file_path: file_path,
                            created_by: userId
                        }]);
                    }
                }

                // Annotations
                if (a.annotations) {
                    for (const ann of a.annotations) {
                        await supabase.from('annotations').insert([{
                            asset_id: assetId,
                            user_id: userId,
                            content: ann.text,
                            x_position: ann.x,
                            y_position: ann.y
                        }]);
                    }
                }
            }
        }
    }

    console.log("\n✅ Migration complete! You can now log in with demo@visuals.co");
}

seed().catch(console.error);
