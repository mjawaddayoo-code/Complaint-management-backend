function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Please login to continue.' });
    }
    next();
}

// Admin auth is intentionally separate from normal user auth — admin is
// not a database user, just a session flag set after the shared admin
// password is verified against ADMIN_PASSWORD.
function requireAdmin(req, res, next) {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'Admin login required.' });
    }
    next();
}

module.exports = { requireAuth, requireAdmin };
