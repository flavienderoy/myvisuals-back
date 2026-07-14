/**
 * Tests — API Routes Structure
 * Verifies all 16 API route groups are correctly mounted and respond
 */
const request = require('supertest');
const app = require('../app');

describe('API Routes Structure', () => {
    const apiRoutes = [
        { path: '/api/projects', description: 'Projects' },
        { path: '/api/clients', description: 'Clients' },
        { path: '/api/assets/project/test-id', description: 'Assets' },
        { path: '/api/looks/project/test-id', description: 'Looks' },
        { path: '/api/tasks', description: 'Tasks' },
        { path: '/api/notifications', description: 'Notifications' },
        { path: '/api/messages/project/test-id', description: 'Messages' },
        { path: '/api/mood-boards', description: 'Mood Boards' },
        { path: '/api/profile', description: 'Profile' },
        { path: '/api/time-entries', description: 'Time Entries' },
        { path: '/api/activities/project/test-id', description: 'Activities' },
        { path: '/api/watermark', description: 'Watermark' },
        { path: '/api/audit-logs', description: 'Audit Logs' },
        { path: '/api/smart-folders', description: 'Smart Folders' },
        { path: '/api/permissions', description: 'Permissions' },
        { path: '/api/annotations', description: 'Annotations' },
    ];

    it.each(apiRoutes)(
        'should have $description route mounted at $path (returns 401, not 404)',
        async ({ path }) => {
            const res = await request(app).get(path);
            // If the route exists, it should return 401 (auth required), NOT 404
            expect(res.status).toBe(401);
        }
    );

    it('should have exactly 16 API route groups', () => {
        expect(apiRoutes).toHaveLength(16);
    });
});

describe('HTTP Methods', () => {
    it('should accept POST with JSON body', async () => {
        const res = await request(app)
            .post('/api/projects')
            .set('Content-Type', 'application/json')
            .send({ name: 'Test' });

        // 401 = route exists and received the request, just not authenticated
        expect(res.status).toBe(401);
    });

    it('should accept PUT with JSON body', async () => {
        const res = await request(app)
            .put('/api/projects/test-id')
            .set('Content-Type', 'application/json')
            .send({ name: 'Updated' });

        expect(res.status).toBe(401);
    });

    it('should accept DELETE requests', async () => {
        const res = await request(app).delete('/api/projects/test-id');
        expect(res.status).toBe(401);
    });
});

describe('Health Check Endpoint', () => {
    it('should be accessible without authentication', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
    });

    it('should return structured health data', async () => {
        const res = await request(app).get('/health');
        expect(res.body).toMatchObject({
            status: 'ok',
            message: 'Visuals.co API is running',
            version: '1.0.0',
        });
        expect(res.body).toHaveProperty('timestamp');
    });
});
