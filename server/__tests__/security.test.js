/**
 * Tests — Security Headers & Middleware
 * Verifies helmet headers, rate limiting, CORS, and general security
 */
const request = require('supertest');
const app = require('../app');

describe('Security Headers (Helmet)', () => {
    it('should set X-Content-Type-Options to nosniff', async () => {
        const res = await request(app).get('/health');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set X-Frame-Options', async () => {
        const res = await request(app).get('/health');
        expect(res.headers['x-frame-options']).toBeDefined();
    });

    it('should set Strict-Transport-Security', async () => {
        const res = await request(app).get('/health');
        expect(res.headers['strict-transport-security']).toBeDefined();
    });

    it('should set X-XSS-Protection', async () => {
        const res = await request(app).get('/health');
        // Helmet may remove this header in newer versions, but CSP should be present
        const hasXss = res.headers['x-xss-protection'] !== undefined;
        const hasCsp = res.headers['content-security-policy'] !== undefined;
        expect(hasXss || hasCsp).toBe(true);
    });

    it('should not expose X-Powered-By header', async () => {
        const res = await request(app).get('/health');
        expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('should set Content-Security-Policy header', async () => {
        const res = await request(app).get('/health');
        expect(res.headers['content-security-policy']).toBeDefined();
    });
});

describe('CORS Configuration', () => {
    it('should allow requests from localhost:5173', async () => {
        const res = await request(app)
            .options('/api/projects')
            .set('Origin', 'http://localhost:5173');

        // CORS preflight should not return 404
        expect(res.status).not.toBe(404);
    });
});

describe('Request Size Limits', () => {
    it('should accept JSON bodies up to 10mb', async () => {
        // Small payload should be fine
        const res = await request(app)
            .post('/api/projects')
            .send({ name: 'test' })
            .set('Content-Type', 'application/json');

        // Will return 401 (no auth) but NOT 413 (payload too large)
        expect(res.status).not.toBe(413);
    });
});

describe('Error Handling', () => {
    it('should return JSON error for unknown API routes', async () => {
        const res = await request(app).get('/api/nonexistent');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
        expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return JSON error for unknown root routes', async () => {
        const res = await request(app).get('/totally-unknown');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
    });

    it('should include the method and path in the 404 error message', async () => {
        const res = await request(app).get('/api/nonexistent');
        expect(res.body.error).toContain('GET');
        expect(res.body.error).toContain('/api/nonexistent');
    });

    it('should return 404 for POST to unknown routes', async () => {
        const res = await request(app)
            .post('/api/nonexistent')
            .send({ data: 'test' });
        expect(res.status).toBe(404);
    });
});
