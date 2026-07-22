/**
 * wipe-storage.js — Deletes ALL files from a Supabase Storage bucket.
 *
 * The bucket itself is kept; only its objects are removed. This uses the
 * Storage API (direct DELETE on storage.objects is blocked by Supabase).
 *
 * Usage:
 *   node scripts/wipe-storage.js --confirm            # wipes the "assets" bucket
 *   node scripts/wipe-storage.js --confirm --bucket=avatars
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const BUCKET =
    (process.argv.find((a) => a.startsWith('--bucket=')) || '--bucket=assets').split('=')[1];
const CONFIRMED = process.argv.includes('--confirm');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Recursively collect every object path under `prefix`.
async function listAll(prefix = '') {
    const paths = [];
    let offset = 0;
    const pageSize = 100;

    for (;;) {
        const { data, error } = await supabase.storage
            .from(BUCKET)
            .list(prefix, { limit: pageSize, offset });
        if (error) throw error;
        if (!data || data.length === 0) break;

        for (const entry of data) {
            const full = prefix ? `${prefix}/${entry.name}` : entry.name;
            // A "folder" has no id/metadata — recurse into it.
            if (entry.id === null || entry.metadata === null) {
                paths.push(...(await listAll(full)));
            } else {
                paths.push(full);
            }
        }

        if (data.length < pageSize) break;
        offset += pageSize;
    }
    return paths;
}

(async () => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env');
        process.exit(1);
    }

    console.log(`🔎 Listing objects in bucket "${BUCKET}"…`);
    const paths = await listAll();

    if (paths.length === 0) {
        console.log('✅ Bucket is already empty. Nothing to do.');
        return;
    }

    console.log(`Found ${paths.length} object(s).`);
    if (!CONFIRMED) {
        console.log('\n⚠️  DRY RUN — nothing deleted.');
        console.log('    Re-run with --confirm to permanently delete these files:');
        paths.slice(0, 10).forEach((p) => console.log('      ' + p));
        if (paths.length > 10) console.log(`      … and ${paths.length - 10} more`);
        return;
    }

    // remove() accepts max 1000 paths per call — chunk it.
    let deleted = 0;
    for (let i = 0; i < paths.length; i += 1000) {
        const chunk = paths.slice(i, i + 1000);
        const { error } = await supabase.storage.from(BUCKET).remove(chunk);
        if (error) throw error;
        deleted += chunk.length;
        console.log(`   deleted ${deleted}/${paths.length}…`);
    }

    console.log(`✅ Done — ${deleted} object(s) removed from "${BUCKET}". Bucket kept.`);
})().catch((err) => {
    console.error('❌ Failed:', err.message || err);
    process.exit(1);
});
