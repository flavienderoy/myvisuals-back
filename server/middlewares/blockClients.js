// RBAC — reject explicit client accounts on studio-only endpoints.
// Legacy studio accounts without a role metadata keep their access.
module.exports = (req, res, next) => {
    if (req.user?.user_metadata?.role === 'client') {
        return res.status(403).json({ error: 'Accès réservé aux studios' });
    }
    next();
};
