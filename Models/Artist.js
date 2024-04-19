const mongoose = require('mongoose');

const ArtistSchema = new mongoose.Schema({
    artistname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: [true,
            "this email already exists"]
    },
    password: {
        type: String,
        required: true
    },
}, { timestamps: true });

module.exports = mongoose.model("Artist", ArtistSchema); 