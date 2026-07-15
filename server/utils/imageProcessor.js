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

// Escape text for safe inclusion in an SVG document.
function escapeXml(str) {
    return String(str).replace(/[<>&'"]/g, (c) => (
        { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]
    ));
}

/**
 * Generate a downscaled preview with a watermark BURNED into the pixels
 * (tiled diagonal text). Unlike a CSS overlay, this cannot be stripped by the
 * client — the original HD is never shipped to the browser.
 *
 * @param {Buffer} sourceBuffer - original image bytes
 * @param {{ text?: string, maxWidth?: number, quality?: number }} [options]
 * @returns {Promise<{ buffer: Buffer, mimetype: string, extension: string } | null>}
 *          null when the source is not a rasterisable image.
 */
async function makeWatermarkedPreview(sourceBuffer, options = {}) {
    const { text = 'PREVIEW', maxWidth = 1600, quality = 70 } = options;
    if (!sourceBuffer) return null;

    try {
        const base = sharp(sourceBuffer, { failOn: 'none' }).rotate();
        const meta = await base.metadata();
        if (!meta.width || !meta.height) return null;

        const targetWidth = Math.min(meta.width, maxWidth);
        const resized = base.resize({ width: targetWidth, withoutEnlargement: true });
        const { data, info } = await resized.webp({ quality }).toBuffer({ resolveWithObject: true });

        const { width, height } = info;
        const label = escapeXml(text).toUpperCase();
        const fontSize = Math.max(18, Math.round(width / 22));
        const tileW = fontSize * label.length * 0.75 + 120;
        const tileH = fontSize * 5;

        const svg = Buffer.from(
            `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="wm" width="${tileW}" height="${tileH}" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
                        <text x="0" y="${tileH / 2}" font-family="Arial, Helvetica, sans-serif" font-weight="bold"
                              font-size="${fontSize}" fill="rgba(255,255,255,0.30)"
                              stroke="rgba(0,0,0,0.12)" stroke-width="1">${label}</text>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#wm)"/>
            </svg>`
        );

        const buffer = await sharp(data)
            .composite([{ input: svg, blend: 'over' }])
            .webp({ quality })
            .toBuffer();

        return { buffer, mimetype: 'image/webp', extension: '.webp' };
    } catch {
        return null;
    }
}

module.exports = { toWebp, makeWatermarkedPreview, CONVERTIBLE_MIME };
