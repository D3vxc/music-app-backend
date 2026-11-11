const bcrypt = require("bcryptjs");
const User = require("../Models/User");
const Artist = require("../Models/Artist");
const { issueSession, clearSession } = require("../Middleware/auth");
const { httpError } = require("../Middleware/errors");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials({ email, password }) {
    if (!email || !EMAIL_RE.test(email)) throw httpError(400, "Enter a valid email");
    if (!password || password.length < 8) throw httpError(400, "Password must be at least 8 characters");
}

const toAccount = (doc, role) => ({
    id: String(doc._id),
    role,
    name: doc.name,
    email: doc.email,
    ...(role === "user" ? { username: doc.username } : { bio: doc.bio, imageUrl: doc.imageUrl }),
});

async function registerUser(req, res) {
    const { name, username, email, password } = req.body;
    validateCredentials(req.body);
    if (!name?.trim()) throw httpError(400, "Name is required");
    if (!/^[a-zA-Z0-9_.]{3,40}$/.test(username || "")) {
        throw httpError(400, "Username must be 3-40 letters, numbers, dots or underscores");
    }
    if (await Artist.exists({ email: email.toLowerCase() })) throw httpError(409, "That email is already taken");
    const user = await User.create({ name, username, email, password: await bcrypt.hash(password, 12) });
    issueSession(res, user, "user");
    res.status(201).json(toAccount(user, "user"));
}

async function registerArtist(req, res) {
    const { name, email, password, bio } = req.body;
    validateCredentials(req.body);
    if (!name?.trim()) throw httpError(400, "Artist name is required");
    if (await User.exists({ email: email.toLowerCase() })) throw httpError(409, "That email is already taken");
    const artist = await Artist.create({ name, email, bio, password: await bcrypt.hash(password, 12) });
    issueSession(res, artist, "artist");
    res.status(201).json(toAccount(artist, "artist"));
}

// One login for both account types. Listeners may log in with username or email.
async function login(req, res) {
    const identifier = String(req.body.identifier || req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!identifier || !password) throw httpError(400, "Enter your email/username and password");

    let account = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] }).select("+password");
    let role = "user";
    if (!account) {
        account = await Artist.findOne({ email: identifier }).select("+password");
        role = "artist";
    }
    // Same message whether the account exists or not.
    if (!account || !(await bcrypt.compare(password, account.password))) {
        throw httpError(401, "Incorrect email/username or password");
    }
    issueSession(res, account, role);
    res.json(toAccount(account, role));
}

function logout(_req, res) {
    clearSession(res);
    res.json({ message: "Logged out" });
}

async function me(req, res) {
    if (!req.auth) return res.json(null);
    const Model = req.auth.role === "artist" ? Artist : User;
    const account = await Model.findById(req.auth.id);
    if (!account) {
        clearSession(res);
        return res.json(null);
    }
    res.json(toAccount(account, req.auth.role));
}

module.exports = { registerUser, registerArtist, login, logout, me, toAccount };
