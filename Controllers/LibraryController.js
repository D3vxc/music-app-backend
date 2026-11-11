const Song = require("../Models/Song");
const Artist = require("../Models/Artist");
const Like = require("../Models/Like");
const Follow = require("../Models/Follow");
const Playlist = require("../Models/Playlist");
const { httpError } = require("../Middleware/errors");
const { escapeRegex, isId, ARTIST_PUBLIC } = require("./helpers");

const ownerType = (auth) => (auth.role === "artist" ? "Artist" : "User");
const SONG_POPULATE = { path: "songs", populate: { path: "artist", select: ARTIST_PUBLIC } };

/* ---------- Liked songs ---------- */

async function likedSongs(req, res) {
    const likes = await Like.find({ account: req.auth.id })
        .sort({ createdAt: -1 })
        .populate({ path: "song", populate: { path: "artist", select: ARTIST_PUBLIC } });
    res.json(likes.filter((l) => l.song).map((l) => ({ ...l.song.toObject(), likedAt: l.createdAt })));
}

async function likedIds(req, res) {
    const likes = await Like.find({ account: req.auth.id }).select("song");
    res.json(likes.map((l) => String(l.song)));
}

async function like(req, res) {
    if (!isId(req.params.songId) || !(await Song.exists({ _id: req.params.songId }))) {
        throw httpError(404, "Song not found");
    }
    await Like.updateOne(
        { account: req.auth.id, song: req.params.songId },
        { $setOnInsert: { account: req.auth.id, song: req.params.songId } },
        { upsert: true },
    );
    res.json({ liked: true });
}

async function unlike(req, res) {
    if (isId(req.params.songId)) await Like.deleteOne({ account: req.auth.id, song: req.params.songId });
    res.json({ liked: false });
}

/* ---------- Followed artists ---------- */

async function followedArtists(req, res) {
    const follows = await Follow.find({ account: req.auth.id }).sort({ createdAt: -1 }).populate("artist", "name imageUrl");
    res.json(follows.filter((f) => f.artist).map((f) => f.artist));
}

async function follow(req, res) {
    if (!isId(req.params.artistId) || !(await Artist.exists({ _id: req.params.artistId }))) {
        throw httpError(404, "Artist not found");
    }
    if (req.params.artistId === req.auth.id) throw httpError(400, "You can't follow yourself");
    await Follow.updateOne(
        { account: req.auth.id, artist: req.params.artistId },
        { $setOnInsert: { account: req.auth.id, artist: req.params.artistId } },
        { upsert: true },
    );
    res.json({ following: true });
}

async function unfollow(req, res) {
    if (isId(req.params.artistId)) await Follow.deleteOne({ account: req.auth.id, artist: req.params.artistId });
    res.json({ following: false });
}

/* ---------- Playlists ---------- */

async function myPlaylists(req, res) {
    const playlists = await Playlist.find({ owner: req.auth.id }).sort({ updatedAt: -1 }).populate(SONG_POPULATE);
    res.json(playlists);
}

async function getPlaylist(req, res) {
    const playlist = await Playlist.findById(req.params.id).populate(SONG_POPULATE).populate("owner", "name username");
    const isOwner = playlist && req.auth && String(playlist.owner?._id) === req.auth.id;
    if (!playlist || (!playlist.isPublic && !isOwner)) throw httpError(404, "Playlist not found");
    res.json({ ...playlist.toObject(), isOwner });
}

async function createPlaylist(req, res) {
    const count = await Playlist.countDocuments({ owner: req.auth.id });
    const playlist = await Playlist.create({
        name: req.body.name?.trim() || `My Playlist #${count + 1}`,
        description: req.body.description,
        isPublic: req.body.isPublic !== false,
        owner: req.auth.id,
        ownerType: ownerType(req.auth),
        songs: isId(req.body.songId) ? [req.body.songId] : [],
    });
    await playlist.populate(SONG_POPULATE);
    res.status(201).json(playlist);
}

async function loadOwnPlaylist(req) {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist || String(playlist.owner) !== req.auth.id) throw httpError(404, "Playlist not found");
    return playlist;
}

async function updatePlaylist(req, res) {
    const playlist = await loadOwnPlaylist(req);
    for (const key of ["name", "description", "isPublic"]) {
        if (req.body[key] !== undefined) playlist[key] = req.body[key];
    }
    await playlist.save();
    await playlist.populate(SONG_POPULATE);
    res.json(playlist);
}

async function deletePlaylist(req, res) {
    const playlist = await loadOwnPlaylist(req);
    await playlist.deleteOne();
    res.json({ message: "Playlist deleted" });
}

async function addToPlaylist(req, res) {
    const playlist = await loadOwnPlaylist(req);
    const { songId } = req.body;
    if (!isId(songId) || !(await Song.exists({ _id: songId }))) throw httpError(404, "Song not found");
    if (playlist.songs.some((id) => String(id) === songId)) throw httpError(409, "Already in this playlist");
    playlist.songs.push(songId);
    await playlist.save();
    await playlist.populate(SONG_POPULATE);
    res.json(playlist);
}

async function removeFromPlaylist(req, res) {
    const playlist = await loadOwnPlaylist(req);
    playlist.songs = playlist.songs.filter((id) => String(id) !== req.params.songId);
    await playlist.save();
    await playlist.populate(SONG_POPULATE);
    res.json(playlist);
}

/* ---------- Search ---------- */

async function search(req, res) {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ songs: [], artists: [], playlists: [] });
    const re = new RegExp(escapeRegex(q), "i");
    const matchingArtists = await Artist.find({ name: re }).limit(12).select("name imageUrl");
    const [songs, playlists] = await Promise.all([
        Song.find({ $or: [{ title: re }, { album: re }, { genre: re }, { artist: { $in: matchingArtists.map((a) => a._id) } }] })
            .sort({ plays: -1 })
            .limit(30)
            .populate("artist", ARTIST_PUBLIC),
        Playlist.find({ isPublic: true, name: re }).limit(12).populate(SONG_POPULATE),
    ]);
    res.json({ songs, artists: matchingArtists, playlists });
}

module.exports = {
    likedSongs, likedIds, like, unlike,
    followedArtists, follow, unfollow,
    myPlaylists, getPlaylist, createPlaylist, updatePlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist,
    search,
};
