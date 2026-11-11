const mongoose = require("mongoose");

const PlaylistSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: "", maxlength: 300 },
    // Owner can be a listener or an artist; both can build playlists.
    owner: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, refPath: "ownerType" },
    ownerType: { type: String, required: true, enum: ["User", "Artist"] },
    isPublic: { type: Boolean, default: true },
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
}, { timestamps: true });

module.exports = mongoose.model("Playlist", PlaylistSchema);
