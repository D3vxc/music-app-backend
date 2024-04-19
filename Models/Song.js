const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
    songname: {
        type: String,
        required: true
    },
    artistname: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Song", SongSchema);