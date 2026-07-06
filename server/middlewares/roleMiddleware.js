const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const userRole = req.user.user_metadata?.role || 'client'; // default to lowest role

        if (allowedRoles.includes('all')) {
            return next();
        }

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ error: `Access denied. Requires one of: ${allowedRoles.join(', ')}` });
        }

        next();
    };
};

module.exports = requireRole;
