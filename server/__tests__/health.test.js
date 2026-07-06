// Using vitest globals (describe, it, expect) — configured in vitest.config.js
const request = require('supertest');
const app = require('../app');

describe('GET /health', () => {
    it('should return 200 with status ok', async () => {
        const res = await request(app).get('/health');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('message', 'Visuals.co API is running');
        expect(res.body).toHaveProperty('version', '1.0.0');
        expect(res.body).toHaveProperty('timestamp');
    });

    it('should return a valid ISO timestamp', async () => {
        const res = await request(app).get('/health');
        const timestamp = new Date(res.body.timestamp);

        expect(timestamp.toISOString()).toBe(res.body.timestamp);
    });

    it('should return JSON content-type', async () => {
        const res = await request(app).get('/health');

        expect(res.headers['content-type']).toMatch(/application\/json/);
    });
});
