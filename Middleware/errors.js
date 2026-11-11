const multer = require("multer");

// Wraps async route handlers so rejected promises reach the error handler.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function httpError(status, message) {
    const err = new Error(message);
    err.status = status;
    return err;
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
    if (err instanceof multer.MulterError) {
        const message = err.code === "LIMIT_FILE_SIZE" ? "Audio files must be 50 MB or smaller" : err.message;
        return res.status(400).json({ message });
    }
    if (err.name === "ValidationError") {
        return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(", ") });
    }
    if (err.name === "CastError") return res.status(404).json({ message: "Not found" });
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || "value";
        return res.status(409).json({ message: `That ${field} is already taken` });
    }
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ message: status >= 500 ? "Something went wrong" : err.message });
}

module.exports = { asyncHandler, httpError, errorHandler };
