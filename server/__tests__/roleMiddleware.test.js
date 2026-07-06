/**
 * Tests — Role-Based Access Control (RBAC) Middleware
 * Verifies the requireRole middleware correctly handles permissions
 */
const requireRole = require('../middlewares/roleMiddleware');

describe('Role Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = { user: { user_metadata: { role: 'creative' } } };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
        next = vi.fn();
    });

    it('should call next() when user has the required role', () => {
        const middleware = requireRole(['creative']);
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() when "all" roles are allowed', () => {
        const middleware = requireRole(['all']);
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should return 403 when user does not have the required role', () => {
        const middleware = requireRole(['admin']);
        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.stringContaining('Access denied') })
        );
    });

    it('should return 401 when user is not authenticated', () => {
        req.user = null;
        const middleware = requireRole(['creative']);
        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should default to "client" role when user_metadata.role is missing', () => {
        req.user = { user_metadata: {} };
        const middleware = requireRole(['client']);
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should reject when default "client" role is not in allowed list', () => {
        req.user = { user_metadata: {} };
        const middleware = requireRole(['admin', 'creative']);
        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should accept any of multiple allowed roles', () => {
        const middleware = requireRole(['admin', 'creative', 'manager']);
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should include allowed roles in the error message', () => {
        const middleware = requireRole(['admin', 'manager']);
        middleware(req, res, next);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: expect.stringContaining('admin'),
            })
        );
    });
});
