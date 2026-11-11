const Song = require("../Models/Song");
const Like = require("../Models/Like");
const Playlist = require("../Models/Playlist");
const { publicUrl, removeFile } = require("../Middleware/upload");
const { httpError } = require("../Middleware/errors");
const { escapeRegex, isId, clampInt, ARTIST_PUBLIC } = require("./helpers");

async function listSongs(req, res) {
    const filter = {};
    if (req.query.q) {
        const re = new RegExp(escapeRegex(req.query.q), "i");
        filter.$or = [{ title: re }, { album: re }, { genre: re }];
    }
    if (req.query.genre) filter.genre = String(req.query.genre).toLowerCase();
    if (req.query.artist && isId(req.query.artist)) filter.artist = req.query.artist;
    const sort = req.query.sort === "popular" ? { plays: -1, createdAt: -1 } : { createdAt: -1 };
    const limit = clampInt(req.query.limit, 50, 1, 200);
    const songs = await Song.find(filter).sort(sort).limit(limit).populate("artist", ARTIST_PUBLIC);
    res.json(songs);
}

async function genres(_req, res) {
    const rows = await Song.aggregate([
        { $match: { genre: { $ne: "" } } },
        { $group: { _id: "$genre", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 30 },
    ]);
    res.json(rows.map((r) => ({ name: r._id, count: r.count })));
}

async function getSong(req, res) {
    const song = await Song.findById(req.params.id).populate("artist", ARTIST_PUBLIC);
    if (!song) throw httpError(404, "Song not found");
    res.json(song);
}

async function createSong(req, res) {
    const audio = req.files?.audio?.[0];
    const cover = req.files?.cover?.[0];
    try {
        if (!audio) throw httpError(400, "An audio file is required");
        if (!req.body.title?.trim()) throw httpError(400, "Title is required");
        const song = await Song.create({
            title: req.body.title,
            album: req.body.album,
            genre: req.body.genre,
            duration: Math.max(0, Math.round(Number(req.body.duration) || 0)),
            artist: req.auth.id,
            audioUrl: publicUrl(audio),
            coverUrl: publicUrl(cover),
        });
        await song.populate("artist", ARTIST_PUBLIC);
        res.status(201).json(song);
    } catch (err) {
        removeFile(publicUrl(audio));
        removeFile(publicUrl(cover));
        throw err;
    }
}

async function loadOwnSong(req) {
    const song = await Song.findById(req.params.id);
    if (!song) throw httpError(404, "Song not found");
    if (String(song.artist) !== req.auth.id) throw httpError(403, "You can only change your own songs");
    return song;
}

async function updateSong(req, res) {
    const cover = req.files?.cover?.[0];
    try {
        const song = await loadOwnSong(req);
        for (const key of ["title", "album", "genre"]) {
            if (req.body[key] !== undefined) song[key] = req.body[key];
        }
        if (cover) {
            removeFile(song.coverUrl);
            song.coverUrl = publicUrl(cover);
        }
        await song.save();
        await song.populate("artist", ARTIST_PUBLIC);
        res.json(song);
    } catch (err) {
        removeFile(publicUrl(cover));
        throw err;
    }
}

async function deleteSong(req, res) {
    const song = await loadOwnSong(req);
    await Promise.all([
        song.deleteOne(),
        Like.deleteMany({ song: song._id }),
        Playlist.updateMany({ songs: song._id }, { $pull: { songs: song._id } }),
    ]);
    removeFile(song.audioUrl);
    removeFile(song.coverUrl);
    res.json({ message: "Song deleted" });
}

async function recordPlay(req, res) {
    const song = await Song.findByIdAndUpdate(req.params.id, { $inc: { plays: 1 } }, { new: true });
    if (!song) throw httpError(404, "Song not found");
    res.json({ plays: song.plays });
}

module.exports = { listSongs, genres, getSong, createSong, updateSong, deleteSong, recordPlay };
