const Artist = require("../Models/Artist");
const Song = require("../Models/Song");
const Like = require("../Models/Like");
const Follow = require("../Models/Follow");
const { publicUrl, removeFile } = require("../Middleware/upload");
const { httpError } = require("../Middleware/errors");
const { escapeRegex, clampInt, ARTIST_PUBLIC } = require("./helpers");
const { toAccount } = require("./AuthController");

async function listArtists(req, res) {
    const filter = req.query.q ? { name: new RegExp(escapeRegex(req.query.q), "i") } : {};
    const limit = clampInt(req.query.limit, 30, 1, 100);
    const artists = await Artist.find(filter).sort({ createdAt: -1 }).limit(limit).select("name imageUrl bio");
    res.json(artists);
}

async function getArtist(req, res) {
    const artist = await Artist.findById(req.params.id).select("name imageUrl bio createdAt");
    if (!artist) throw httpError(404, "Artist not found");
    const [songs, followers, playsAgg, following] = await Promise.all([
        Song.find({ artist: artist._id }).sort({ plays: -1, createdAt: -1 }).populate("artist", ARTIST_PUBLIC),
        Follow.countDocuments({ artist: artist._id }),
        Song.aggregate([{ $match: { artist: artist._id } }, { $group: { _id: null, plays: { $sum: "$plays" } } }]),
        req.auth ? Follow.exists({ account: req.auth.id, artist: artist._id }) : null,
    ]);
    res.json({ artist, songs, followers, following: !!following, totalPlays: playsAgg[0]?.plays || 0 });
}

// Dashboard numbers for the logged-in artist.
async function myStats(req, res) {
    const songs = await Song.find({ artist: req.auth.id }).sort({ createdAt: -1 }).populate("artist", ARTIST_PUBLIC);
    const ids = songs.map((s) => s._id);
    const [followers, likeRows] = await Promise.all([
        Follow.countDocuments({ artist: req.auth.id }),
        Like.aggregate([{ $match: { song: { $in: ids } } }, { $group: { _id: "$song", likes: { $sum: 1 } } }]),
    ]);
    const likes = Object.fromEntries(likeRows.map((r) => [String(r._id), r.likes]));
    res.json({
        followers,
        totalPlays: songs.reduce((sum, s) => sum + s.plays, 0),
        totalLikes: likeRows.reduce((sum, r) => sum + r.likes, 0),
        songs: songs.map((s) => ({ ...s.toObject(), likes: likes[String(s._id)] || 0 })),
    });
}

async function updateMe(req, res) {
    const image = req.file;
    try {
        const artist = await Artist.findById(req.auth.id);
        if (!artist) throw httpError(404, "Artist not found");
        if (req.body.name !== undefined) artist.name = req.body.name;
        if (req.body.bio !== undefined) artist.bio = req.body.bio;
        if (image) {
            removeFile(artist.imageUrl);
            artist.imageUrl = publicUrl(image);
        }
        await artist.save();
        res.json(toAccount(artist, "artist"));
    } catch (err) {
        removeFile(publicUrl(image));
        throw err;
    }
}

module.exports = { listArtists, getArtist, myStats, updateMe };
