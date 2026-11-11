const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const config = require('../config');
const { HttpError } = require('../errors');

const ALLOWED = {
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm', 'audio/aac', 'audio/mp4', 'audio/flac'],
  cover: ['image/jpeg', 'image/png', 'image/webp'],
};

fs.mkdirSync(config.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: config.uploadDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 6);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const songUpload = multer({
  storage,
  limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, cb) => {
    const allowed = ALLOWED[file.fieldname];
    if (!allowed) return cb(new HttpError(400, `Unexpected file field "${file.fieldname}"`));
    if (!allowed.includes(file.mimetype)) return cb(new HttpError(400, `Unsupported ${file.fieldname} type ${file.mimetype}`));
    return cb(null, true);
  },
}).fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]);

module.exports = { songUpload };
