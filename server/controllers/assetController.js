const archiver = require('archiver');
const supabase = require('../config/supabase');
const { toWebp, makeWatermarkedPreview } = require('../utils/imageProcessor');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');

const BUCKET = 'assets';
const PREVIEW_TTL = 3600; // 1h — signed URL lifetime for watermarked previews
const DOWNLOAD_TTL = 60; // 60s — signed URL lifetime for original HD downloads

// Sign the watermarked preview (falls back to the file itself for non-images).
// The ORIGINAL is never signed here — only via the authorized download endpoint.
async function signPreview(row) {
    const path = row?.preview_path || row?.file_path;
    if (!path) return null;
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, PREVIEW_TTL);
    return data?.signedUrl || null;
}

// Watermark label = the studio's organization/name (fallback "PREVIEW").
async function getWatermarkText(ownerId) {
    if (!ownerId) return 'PREVIEW';
    const { data } = await supabase
        .from('profiles')
        .select('name, organization')
        .eq('id', ownerId)
        .single();
    return data?.organization || data?.name || 'PREVIEW';
}

/**
 * Upload the original HD file (private) and a watermark-burned preview.
 * Returns { filePath, previewPath, size, mime }.
 */
async function uploadRenditions({ file, basePath, ownerId }) {
    const processed = await toWebp(file);
    const filePath = `${basePath}${processed.extension}`;

    const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, processed.buffer, { contentType: processed.mimetype, upsert: false });
    if (upErr) throw upErr;

    // Watermarked preview (images only). Non-images reuse the original as preview.
    let previewPath = filePath;
    const watermarkText = await getWatermarkText(ownerId);
    const preview = await makeWatermarkedPreview(file.buffer, { text: watermarkText });
    if (preview) {
        previewPath = `${basePath}.preview.webp`;
        const { error: pErr } = await supabase.storage
            .from(BUCKET)
            .upload(previewPath, preview.buffer, { contentType: preview.mimetype, upsert: false });
        if (pErr) throw pErr;
    }

    return { filePath, previewPath, size: processed.buffer.length, mime: processed.mimetype };
}

// Get assets for a project (optionally filtered by look)
exports.getAssets = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { look_id } = req.query;
        const pagination = getPaginationParams(req.query, { defaultLimit: 50 });

        let query = supabase
            .from('assets')
            .select('*, look:looks(name), annotations(count)', pagination.hasPagination ? { count: 'exact' } : undefined)
            .eq('project_id', projectId)
            .order('position', { ascending: true });

        if (look_id) {
            query = query.eq('look_id', look_id);
        }
        if (pagination.hasPagination) query = query.range(pagination.from, pagination.to);

        const { data, error, count } = await query;
        if (error) throw error;

        // Attach short-lived signed URLs to the watermarked previews
        const withUrls = await Promise.all(
            (data || []).map(async (a) => ({ ...a, url: await signPreview(a) }))
        );
        res.json(buildPaginatedResponse(withUrls, count, pagination));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single asset with versions and annotations
exports.getAssetById = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('assets')
            .select(`
                *,
                look:looks(name),
                versions:asset_versions(*),
                annotations(*)
            `)
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Asset not found' });

        // Sign the asset preview and each version preview
        data.url = await signPreview(data);
        if (Array.isArray(data.versions)) {
            data.versions = await Promise.all(
                data.versions.map(async (v) => ({ ...v, url: await signPreview(v) }))
            );
        }

        // Attach authors separately (no reliable FK embed for profiles)
        const userIds = new Set();
        (data.annotations || []).forEach((a) => a.user_id && userIds.add(a.user_id));
        (data.versions || []).forEach((v) => v.created_by && userIds.add(v.created_by));
        if (userIds.size) {
            const { data: profs } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .in('id', [...userIds]);
            const byId = Object.fromEntries((profs || []).map((p) => [p.id, p]));
            data.annotations = (data.annotations || []).map((a) => ({ ...a, author: byId[a.user_id] || null }));
            data.versions = (data.versions || []).map((v) => ({ ...v, created_by_profile: byId[v.created_by] || null }));
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Upload & create asset
exports.createAsset = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, type, look_id, position } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload original (private) + burn a watermarked preview
        const { filePath, previewPath, size, mime } = await uploadRenditions({
            file: req.file,
            basePath: `${req.user.id}/${projectId}/${Date.now()}`,
            ownerId: req.user.id,
        });

        // Create asset record — no public URL is ever stored
        const { data, error } = await supabase
            .from('assets')
            .insert([{
                name: name || req.file.originalname,
                type: type || mime.split('/')[0],
                file_path: filePath,
                preview_path: previewPath,
                project_id: projectId,
                look_id: look_id || null,
                position: position || 0,
                file_size: size,
                mime_type: mime,
                owner_id: req.user.id,
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ ...data[0], url: await signPreview(data[0]) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update asset metadata
exports.updateAsset = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('assets')
            .update({ ...req.body, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        if (!data.length) return res.status(404).json({ error: 'Asset not found' });
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete asset (also removes from storage)
exports.deleteAsset = async (req, res) => {
    try {
        // Get file path first
        const { data: asset } = await supabase
            .from('assets')
            .select('file_path')
            .eq('id', req.params.id)
            .single();

        if (asset?.file_path) {
            await supabase.storage.from('assets').remove([asset.file_path]);
        }

        const { error } = await supabase
            .from('assets')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add annotation to an asset
exports.addAnnotation = async (req, res) => {
    try {
        const { content, x_position, y_position, timestamp } = req.body;

        const row = {
            asset_id: req.params.id,
            user_id: req.user.id,
            content,
            x: x_position,
            y: y_position,
        };
        // `timestamp` is a numeric column (video position in seconds); only set
        // it when a number is provided — the creation date lives in created_at.
        if (typeof timestamp === 'number') row.timestamp = timestamp;

        const { data, error } = await supabase
            .from('annotations')
            .insert([row])
            .select('*');

        if (error) throw error;

        // Attach the author separately (no reliable FK relationship for the embed)
        const { data: author } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('id', req.user.id)
            .single();

        // Expose created_at as `timestamp` so the UI can show when it was added
        res.status(201).json({ ...data[0], timestamp: data[0].created_at, author: author || null });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Upload new version of an asset
exports.uploadVersion = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { filePath, previewPath } = await uploadRenditions({
            file: req.file,
            basePath: `${req.user.id}/versions/${req.params.id}/${Date.now()}`,
            ownerId: req.user.id,
        });

        // Get current version count
        const { count } = await supabase
            .from('asset_versions')
            .select('*', { count: 'exact', head: true })
            .eq('asset_id', req.params.id);

        const { data, error } = await supabase
            .from('asset_versions')
            .insert([{
                asset_id: req.params.id,
                version_number: (count || 0) + 1,
                file_path: filePath,
                preview_path: previewPath,
                created_by: req.user.id,
                comment: req.body.comment || null,
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ ...data[0], url: await signPreview(data[0]) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Authorized download of the ORIGINAL HD file.
// The original is never shipped to the browser except through this endpoint,
// which mints a very short-lived signed URL only for authorized requesters.
exports.downloadAsset = async (req, res) => {
    try {
        const { data: asset, error } = await supabase
            .from('assets')
            .select('id, name, status, file_path, project:projects(owner_id, client_id)')
            .eq('id', req.params.id)
            .single();

        if (error || !asset) return res.status(404).json({ error: 'Asset not found' });
        if (!asset.file_path) return res.status(404).json({ error: 'No file for this asset' });

        const isOwner = asset.project?.owner_id === req.user.id;

        let allowed = isOwner;
        if (!allowed && asset.status === 'approved' && asset.project?.client_id) {
            // The requester must be the client linked to this project, and the asset approved
            const { data: link } = await supabase
                .from('clients')
                .select('id')
                .eq('id', asset.project.client_id)
                .eq('user_id', req.user.id)
                .maybeSingle();
            allowed = Boolean(link);
        }

        if (!allowed) {
            return res.status(403).json({ error: 'Not authorized to download this file' });
        }

        const { data, error: signErr } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(asset.file_path, DOWNLOAD_TTL, { download: asset.name || true });
        if (signErr) throw signErr;

        res.json({ url: data.signedUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Can this user download this project's original files?
// Returns 'owner' | 'client' | null.
async function projectDownloadRole(project, user) {
    if (!project) return null;
    if (project.owner_id === user.id) return 'owner';
    if (project.client_id) {
        const { data: link } = await supabase
            .from('clients')
            .select('id')
            .eq('id', project.client_id)
            .eq('user_id', user.id)
            .maybeSingle();
        if (link) return 'client';
    }
    return null;
}

// Stream a ZIP of a project's original files. Studio gets everything;
// a linked client gets only approved assets. Optional ?ids=a,b limits selection.
exports.downloadProjectZip = async (req, res) => {
    try {
        const { projectId } = req.params;
        const ids = req.query.ids ? req.query.ids.split(',').filter(Boolean) : null;

        const { data: project } = await supabase
            .from('projects')
            .select('id, name, owner_id, client_id')
            .eq('id', projectId)
            .single();

        const role = await projectDownloadRole(project, req.user);
        if (!role) return res.status(403).json({ error: 'Not authorized' });

        let q = supabase.from('assets').select('id, name, status, file_path').eq('project_id', projectId);
        if (ids) q = q.in('id', ids);
        if (role === 'client') q = q.eq('status', 'approved');

        const { data: assets } = await q;
        const downloadable = (assets || []).filter((a) => a.file_path);
        if (downloadable.length === 0) {
            return res.status(404).json({ error: 'No downloadable files' });
        }

        const zipName = `${(project.name || 'assets').replace(/[^a-z0-9-_]+/gi, '_')}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

        const archive = archiver('zip', { zlib: { level: 6 } });
        archive.on('error', (err) => {
            if (!res.headersSent) res.status(500).json({ error: err.message });
        });
        archive.pipe(res);

        const usedNames = new Set();
        for (const a of downloadable) {
            const { data: blob, error } = await supabase.storage.from(BUCKET).download(a.file_path);
            if (error || !blob) continue;
            const buf = Buffer.from(await blob.arrayBuffer());
            const ext = a.file_path.slice(a.file_path.lastIndexOf('.'));
            let base = (a.name || a.id).replace(/[/\\]/g, '_');
            if (!base.toLowerCase().endsWith(ext.toLowerCase())) base += ext;
            // De-duplicate identical file names inside the archive
            let name = base;
            let i = 1;
            while (usedNames.has(name)) name = base.replace(ext, `_${i++}${ext}`);
            usedNames.add(name);
            archive.append(buf, { name });
        }
        await archive.finalize();
    } catch (error) {
        if (!res.headersSent) res.status(500).json({ error: error.message });
    }
};
