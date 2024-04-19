const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstname: {
        type: String,
        // required: true
    },
    lastname: {
        type: String,
        // required: true
    },
    username: {
        type: String,
        // required: true,
        unique: [true, "this username already exists"]
    },
    email: {
        type: String,
        unique: [true,
            "this email already exists"]
    },
    password: {
        type: String,
        // required: true
    },

}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema); 