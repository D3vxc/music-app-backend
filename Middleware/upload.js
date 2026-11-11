const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const UPLOAD_ROOT = path.join(__dirname, "..", "uploads");
const AUDIO_DIR = path.join(UPLOAD_ROOT, "audio");
const IMAGE_DIR = path.join(UPLOAD_ROOT, "images");
fs.mkdirSync(AUDIO_DIR, { recursive: true });
fs.mkdirSync(IMAGE_DIR, { recursive: true });

const AUDIO_TYPES = {
    "audio/mpeg": ".mp3", "audio/mp3": ".mp3", "audio/wav": ".wav", "audio/x-wav": ".wav",
    "audio/wave": ".wav", "audio/ogg": ".ogg", "audio/flac": ".flac", "audio/x-flac": ".flac",
    "audio/aac": ".aac", "audio/mp4": ".m4a", "audio/x-m4a": ".m4a", "audio/webm": ".webm",
};
const IMAGE_TYPES = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };

const MAX_AUDIO = 50 * 1024 * 1024;
const MAX_IMAGE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
    destination: (_req, file, cb) => cb(null, file.mimetype in AUDIO_TYPES ? AUDIO_DIR : IMAGE_DIR),
    // Never trust the client filename - random name + extension derived from the mimetype.
    filename: (_req, file, cb) => {
        const ext = AUDIO_TYPES[file.mimetype] || IMAGE_TYPES[file.mimetype];
        cb(null, crypto.randomBytes(16).toString("hex") + ext);
    },
});

function fileFilter(_req, file, cb) {
    const okAudio = file.fieldname === "audio" && file.mimetype in AUDIO_TYPES;
    const okImage = ["cover", "image"].includes(file.fieldname) && file.mimetype in IMAGE_TYPES;
    if (okAudio || okImage) return cb(null, true);
    const err = new Error(`Unsupported file type for "${file.fieldname}": ${file.mimetype}`);
    err.status = 400;
    cb(err);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_AUDIO, files: 2 } });

// Images have a lower cap than the global multer limit.
function enforceImageSize(req, _res, next) {
    const files = Object.values(req.files || {}).flat().concat(req.file ? [req.file] : []);
    const big = files.find((f) => f.mimetype in IMAGE_TYPES && f.size > MAX_IMAGE);
    if (big) {
        files.forEach((f) => removeFile(publicUrl(f)));
        const err = new Error("Images must be 5 MB or smaller");
        err.status = 400;
        return next(err);
    }
    next();
}

function publicUrl(file) {
    if (!file) return "";
    const sub = file.destination === AUDIO_DIR ? "audio" : "images";
    return `/uploads/${sub}/${file.filename}`;
}

// Removes a previously uploaded file given its public URL. Ignores anything outside /uploads.
function removeFile(url) {
    if (!url || !url.startsWith("/uploads/")) return;
    const target = path.normalize(path.join(UPLOAD_ROOT, url.slice("/uploads/".length)));
    if (!target.startsWith(UPLOAD_ROOT + path.sep)) return;
    fs.promises.unlink(target).catch(() => {});
}

module.exports = { upload, enforceImageSize, publicUrl, removeFile, UPLOAD_ROOT };
