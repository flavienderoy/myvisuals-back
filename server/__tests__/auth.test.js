/**
 * Tests — Authentication Middleware
 * Verifies that protected routes reject unauthenticated requests
 */
const request = require('supertest');
const app = require('../app');

describe('Authentication Middleware', () => {
    const protectedRoutes = [
        { method: 'get', path: '/api/projects' },
        { method: 'get', path: '/api/clients' },
        { method: 'get', path: '/api/assets/project/test-id' },
        { method: 'get', path: '/api/notifications' },
        { method: 'get', path: '/api/tasks' },
        { method: 'get', path: '/api/messages/project/test-id' },
        { method: 'get', path: '/api/mood-boards' },
        { method: 'get', path: '/api/profile' },
        { method: 'get', path: '/api/time-entries' },
        { method: 'get', path: '/api/activities/project/test-id' },
        { method: 'get', path: '/api/watermark' },
        { method: 'get', path: '/api/audit-logs' },
        { method: 'get', path: '/api/smart-folders' },
        { method: 'get', path: '/api/permissions' },
        { method: 'get', path: '/api/annotations' },
        { method: 'get', path: '/api/looks/project/test-id' },
    ];

    it.each(protectedRoutes)(
        'should return 401 for $method $path without token',
        async ({ method, path }) => {
            const res = await request(app)[method](path);
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error');
        }
    );

    it('should return 401 when Authorization header has no Bearer token', async () => {
        const res = await request(app)
            .get('/api/projects')
            .set('Authorization', 'InvalidFormat');

        expect(res.status).toBe(401);
    });

    it('should return 401 with an invalid JWT token', async () => {
        const res = await request(app)
            .get('/api/projects')
            .set('Authorization', 'Bearer fake.invalid.token');

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error');
    });

    it('should reject POST requests without token', async () => {
        const res = await request(app)
            .post('/api/projects')
            .send({ name: 'Test Project' });

        expect(res.status).toBe(401);
    });

    it('should reject PUT requests without token', async () => {
        const res = await request(app)
            .put('/api/projects/some-id')
            .send({ name: 'Updated' });

        expect(res.status).toBe(401);
    });

    it('should reject DELETE requests without token', async () => {
        const res = await request(app).delete('/api/projects/some-id');
        expect(res.status).toBe(401);
    });
});
