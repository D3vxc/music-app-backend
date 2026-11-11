const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const mongoose = require('mongoose');
const config = require('./config');
const { HttpError } = require('./errors');

function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || config.clientOrigins.includes('*') || config.clientOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
    })
  );
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'up' : 'down' });
  });

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: 'draft-7', legacyHeaders: false });
  app.use('/api/auth', authLimiter, require('./routes/auth'));
  app.use('/api/songs', require('./routes/songs'));
  app.use('/api/playlists', require('./routes/playlists'));
  app.use('/uploads', express.static(path.resolve(config.uploadDir), { maxAge: '7d', fallthrough: false }));

  app.use((_req, _res, next) => next(new HttpError(404, 'Not found')));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError) err = new HttpError(400, err.message);
    if (err.type === 'entity.parse.failed') err = new HttpError(400, 'Malformed JSON body');
    if (err.status === 404 && !(err instanceof HttpError)) err = new HttpError(404, 'Not found');
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({
      error: status >= 500 ? 'Something went wrong' : err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  });

  return app;
}

module.exports = { createApp };
