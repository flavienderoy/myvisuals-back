const sharp = require('sharp');

// Image MIME types we convert to WebP (eco-design + performance).
// Everything else (SVG, PDF, video, 3D archives…) is passed through untouched.
const CONVERTIBLE_MIME = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/tiff',
    'image/bmp',
    'image/gif',
]);

/**
 * Compress a raster image to WebP to reduce storage & bandwidth (30-50% lighter).
 * Non-convertible files are returned unchanged so the caller can upload as-is.
 *
 * @param {import('multer').File} file - Multer file (memoryStorage → has .buffer)
 * @param {{ quality?: number, maxWidth?: number }} [options]
 * @returns {Promise<{ buffer: Buffer, mimetype: string, extension: string, converted: boolean }>}
 */
async function toWebp(file, options = {}) {
    const { quality = 80, maxWidth = 3840 } = options;

    if (!file || !file.buffer || !CONVERTIBLE_MIME.has(file.mimetype)) {
        return {
            buffer: file?.buffer,
            mimetype: file?.mimetype,
            extension: file ? file.originalname.slice(file.originalname.lastIndexOf('.')) : '',
            converted: false,
        };
    }

    const pipeline = sharp(file.buffer, { failOn: 'none' }).rotate();

    // Downscale oversized images (e.g. 8K exports) while preserving aspect ratio.
    const metadata = await pipeline.metadata();
    if (metadata.width && metadata.width > maxWidth) {
        pipeline.resize({ width: maxWidth, withoutEnlargement: true });
    }

    const buffer = await pipeline.webp({ quality }).toBuffer();

    return {
        buffer,
        mimetype: 'image/webp',
        extension: '.webp',
        converted: true,
    };
}

module.exports = { toWebp, CONVERTIBLE_MIME };
