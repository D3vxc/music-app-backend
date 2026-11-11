const mongoose = require("mongoose");

// "Liked Songs" - account can be a listener or an artist.
const LikeSchema = new mongoose.Schema({
    account: { type: mongoose.Schema.Types.ObjectId, required: true },
    song: { type: mongoose.Schema.Types.ObjectId, ref: "Song", required: true, index: true },
}, { timestamps: true });

LikeSchema.index({ account: 1, song: 1 }, { unique: true });

module.exports = mongoose.model("Like", LikeSchema);
