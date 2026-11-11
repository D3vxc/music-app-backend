const mongoose = require("mongoose");

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isId = (id) => mongoose.isValidObjectId(id);

const clampInt = (value, def, min, max) => {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : def;
};

const pick = (obj, keys) =>
    Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

const ARTIST_PUBLIC = "name imageUrl";

module.exports = { escapeRegex, isId, clampInt, pick, ARTIST_PUBLIC };
