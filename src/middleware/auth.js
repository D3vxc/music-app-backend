const jwt = require('jsonwebtoken');
const config = require('../config');
const { HttpError } = require('../errors');

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function readToken(req) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

function optionalAuth(req, _res, next) {
  const token = readToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      // ignore invalid tokens on public routes
    }
  }
  next();
}

function requireAuth(req, _res, next) {
  const token = readToken(req);
  if (!token) return next(new HttpError(401, 'Authentication required'));
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(new HttpError(401, 'Invalid or expired token'));
  }
}

const requireRole = (role) => (req, _res, next) =>
  req.user?.role === role ? next() : next(new HttpError(403, `Only ${role}s can do this`));

module.exports = { signToken, optionalAuth, requireAuth, requireRole };
