const mongoose = require("mongoose");

const FollowSchema = new mongoose.Schema({
    account: { type: mongoose.Schema.Types.ObjectId, required: true },
    artist: { type: mongoose.Schema.Types.ObjectId, ref: "Artist", required: true, index: true },
}, { timestamps: true });

FollowSchema.index({ account: 1, artist: 1 }, { unique: true });

module.exports = mongoose.model("Follow", FollowSchema);
