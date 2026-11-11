const router = require('express').Router();
const mongoose = require('mongoose');
const { z } = require('zod');
const Playlist = require('../models/Playlist');
const Song = require('../models/Song');
const { asyncHandler, parse, HttpError } = require('../errors');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const playlistSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).optional(),
  isPublic: z.boolean().optional(),
});

async function loadPlaylist(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Playlist not found');
  const playlist = await Playlist.findById(id);
  if (!playlist) throw new HttpError(404, 'Playlist not found');
  return playlist;
}

function assertOwner(playlist, user) {
  if (playlist.owner.toString() !== user.id) throw new HttpError(403, 'Not your playlist');
}

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await Playlist.find({ owner: req.user.id }).sort({ updatedAt: -1 });
    res.json({ items });
  })
);

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const playlist = await Playlist.create({ ...parse(playlistSchema, req.body), owner: req.user.id });
    res.status(201).json({ playlist });
  })
);

router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const playlist = await loadPlaylist(req.params.id);
    const isOwner = req.user && playlist.owner.toString() === req.user.id;
    if (!playlist.isPublic && !isOwner) throw new HttpError(404, 'Playlist not found');
    await playlist.populate('songs');
    playlist.songs = playlist.songs.filter(Boolean);
    res.json({ playlist });
  })
);

router.patch(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const playlist = await loadPlaylist(req.params.id);
    assertOwner(playlist, req.user);
    Object.assign(playlist, parse(playlistSchema.partial(), req.body));
    await playlist.save();
    res.json({ playlist });
  })
);

router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const playlist = await loadPlaylist(req.params.id);
    assertOwner(playlist, req.user);
    await playlist.deleteOne();
    res.status(204).end();
  })
);

router.post(
  '/:id/songs',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { songId } = parse(z.object({ songId: z.string() }), req.body);
    const playlist = await loadPlaylist(req.params.id);
    assertOwner(playlist, req.user);
    if (!mongoose.isValidObjectId(songId) || !(await Song.exists({ _id: songId }))) {
      throw new HttpError(404, 'Song not found');
    }
    await Playlist.updateOne({ _id: playlist._id }, { $addToSet: { songs: songId } });
    res.json({ playlist: await Playlist.findById(playlist._id) });
  })
);

router.delete(
  '/:id/songs/:songId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const playlist = await loadPlaylist(req.params.id);
    assertOwner(playlist, req.user);
    if (!mongoose.isValidObjectId(req.params.songId)) throw new HttpError(404, 'Song not found');
    await Playlist.updateOne({ _id: playlist._id }, { $pull: { songs: req.params.songId } });
    res.json({ playlist: await Playlist.findById(playlist._id) });
  })
);

module.exports = router;
