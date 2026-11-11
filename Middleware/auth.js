const jwt = require("jsonwebtoken");
const config = require("../config");

const COOKIE_NAME = "access_token";
const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProd,
    maxAge: 30 * 24 * 60 * 60 * 1000,
};

function issueSession(res, account, role) {
    const token = jwt.sign({ id: String(account._id), role }, config.jwtSecret, { expiresIn: "30d" });
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
}

function clearSession(res) {
    res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: undefined });
}

// Attaches req.auth = { id, role } when a valid session cookie is present.
function readSession(req, _res, next) {
    const token = req.cookies?.[COOKIE_NAME];
    if (token) {
        try {
            const { id, role } = jwt.verify(token, config.jwtSecret);
            req.auth = { id, role };
        } catch {
            // invalid/expired token -> treat as anonymous
        }
    }
    next();
}

function requireAuth(req, res, next) {
    if (!req.auth) return res.status(401).json({ message: "Please log in" });
    next();
}

function requireArtist(req, res, next) {
    if (!req.auth) return res.status(401).json({ message: "Please log in" });
    if (req.auth.role !== "artist") return res.status(403).json({ message: "Artist account required" });
    next();
}

module.exports = { issueSession, clearSession, readSession, requireAuth, requireArtist };
