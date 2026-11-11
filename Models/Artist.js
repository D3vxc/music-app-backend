const mongoose = require("mongoose");

const ArtistSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    bio: { type: String, default: "", maxlength: 1000 },
    imageUrl: { type: String, default: "" },
}, { timestamps: true });


module.exports = mongoose.model("Artist", ArtistSchema);
