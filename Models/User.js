const mongoose = require("mongoose");

// A listener account.
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 80 },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 40 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
