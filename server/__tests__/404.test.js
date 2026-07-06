// Using vitest globals (describe, it, expect) — configured in vitest.config.js
const request = require('supertest');
const app = require('../app');

describe('404 Handler', () => {
    it('should return 404 for unknown GET routes', async () => {
        const res = await request(app).get('/api/this-route-does-not-exist');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toContain('not found');
    });

    it('should return 404 for unknown POST routes', async () => {
        const res = await request(app)
            .post('/api/nonexistent')
            .send({ data: 'test' });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toContain('POST');
    });

    it('should include the method and URL in the error message', async () => {
        const res = await request(app).delete('/api/unknown-resource/123');

        expect(res.status).toBe(404);
        expect(res.body.error).toContain('DELETE');
        expect(res.body.error).toContain('/api/unknown-resource/123');
    });
});
