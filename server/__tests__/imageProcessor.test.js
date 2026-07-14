// Using vitest globals (describe, it, expect) — configured in vitest.config.js
const sharp = require('sharp');
const { toWebp } = require('../utils/imageProcessor');

// Build a fake multer file (memoryStorage shape) from a sharp-generated image.
async function makeFile(mimetype, originalname, { width = 800, height = 600 } = {}) {
    const buffer = await sharp({
        create: {
            width,
            height,
            channels: 3,
            background: { r: 200, g: 60, b: 60 },
        },
    })
        .png()
        .toBuffer();
    return { buffer, mimetype, originalname, size: buffer.length };
}

describe('imageProcessor.toWebp', () => {
    it('converts a PNG to WebP', async () => {
        const file = await makeFile('image/png', 'shoot.png');
        const result = await toWebp(file);

        expect(result.converted).toBe(true);
        expect(result.mimetype).toBe('image/webp');
        expect(result.extension).toBe('.webp');

        const meta = await sharp(result.buffer).metadata();
        expect(meta.format).toBe('webp');
    });

    it('produces a lighter file than the source PNG', async () => {
        const file = await makeFile('image/png', 'render.png', { width: 1600, height: 1200 });
        const result = await toWebp(file);
        expect(result.buffer.length).toBeLessThan(file.buffer.length);
    });

    it('downscales images wider than maxWidth', async () => {
        const file = await makeFile('image/png', 'huge.png', { width: 5000, height: 3000 });
        const result = await toWebp(file, { maxWidth: 3840 });
        const meta = await sharp(result.buffer).metadata();
        expect(meta.width).toBe(3840);
    });

    it('passes through non-convertible files untouched (e.g. PDF)', async () => {
        const pdf = { buffer: Buffer.from('%PDF-1.7'), mimetype: 'application/pdf', originalname: 'brief.pdf' };
        const result = await toWebp(pdf);
        expect(result.converted).toBe(false);
        expect(result.mimetype).toBe('application/pdf');
        expect(result.extension).toBe('.pdf');
    });

    it('handles a missing file gracefully', async () => {
        const result = await toWebp(undefined);
        expect(result.converted).toBe(false);
    });
});
