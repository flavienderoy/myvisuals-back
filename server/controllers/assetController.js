const supabase = require('../config/supabase');
const { toWebp } = require('../utils/imageProcessor');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');

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
        res.json(buildPaginatedResponse(data, count, pagination));
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
                versions:asset_versions(*, created_by_profile:profiles(name, avatar_url)),
                annotations(*, author:profiles(name, avatar_url))
            `)
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Asset not found' });
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

        // Compress raster images to WebP (eco-design + faster delivery)
        const processed = await toWebp(req.file);
        const filePath = `${req.user.id}/${projectId}/${Date.now()}${processed.extension}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(filePath, processed.buffer, {
                contentType: processed.mimetype,
                upsert: false,
            });

        if (uploadError) throw uploadError;

        // Get public/signed URL
        const { data: urlData } = supabase.storage
            .from('assets')
            .getPublicUrl(filePath);

        const fileUrl = urlData.publicUrl;

        // Create asset record
        const { data, error } = await supabase
            .from('assets')
            .insert([{
                name: name || req.file.originalname,
                type: type || processed.mimetype.split('/')[0],
                url: fileUrl,
                file_path: filePath,
                project_id: projectId,
                look_id: look_id || null,
                position: position || 0,
                file_size: processed.buffer.length,
                mime_type: processed.mimetype,
                uploaded_by: req.user.id,
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
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

        const { data, error } = await supabase
            .from('annotations')
            .insert([{
                asset_id: req.params.id,
                user_id: req.user.id,
                content,
                x_position,
                y_position,
                timestamp,
            }])
            .select('*, author:profiles(name, avatar_url)');

        if (error) throw error;
        res.status(201).json(data[0]);
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

        const processed = await toWebp(req.file);
        const filePath = `${req.user.id}/versions/${req.params.id}/${Date.now()}${processed.extension}`;

        const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(filePath, processed.buffer, {
                contentType: processed.mimetype,
            });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
            .from('assets')
            .getPublicUrl(filePath);

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
                url: urlData.publicUrl,
                file_path: filePath,
                created_by: req.user.id,
                comment: req.body.comment || null,
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
