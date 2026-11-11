const mongoose = require("mongoose");

const SongSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 120 },
    artist: { type: mongoose.Schema.Types.ObjectId, ref: "Artist", required: true, index: true },
    album: { type: String, default: "", trim: true, maxlength: 120 },
    genre: { type: String, default: "", trim: true, lowercase: true, maxlength: 40 },
    duration: { type: Number, default: 0 }, // seconds
    audioUrl: { type: String, required: true },
    coverUrl: { type: String, default: "" },
    plays: { type: Number, default: 0 },
}, { timestamps: true });


module.exports = mongoose.model("Song", SongSchema);
