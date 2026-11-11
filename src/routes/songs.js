const fs = require('fs/promises');
const path = require('path');
const router = require('express').Router();
const mongoose = require('mongoose');
const { z } = require('zod');
const Song = require('../models/Song');
const User = require('../models/User');
const config = require('../config');
const { asyncHandler, parse, HttpError } = require('../errors');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');
const { songUpload } = require('../middleware/upload');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const listSchema = z.object({
  q: z.string().trim().max(100).optional(),
  genre: z.string().trim().toLowerCase().max(40).optional(),
  artist: z.string().optional(),
  sort: z.enum(['new', 'popular', 'title']).default('new'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const songSchema = z.object({
  title: z.string().trim().min(1).max(120),
  album: z.string().trim().max(120).optional(),
  genre: z.string().trim().toLowerCase().max(40).optional(),
  durationSec: z.coerce.number().min(0).max(60 * 60 * 3).optional(),
});

const SORTS = { new: { createdAt: -1 }, popular: { plays: -1, likes: -1 }, title: { title: 1 } };

async function findSong(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Song not found');
  const song = await Song.findById(id);
  if (!song) throw new HttpError(404, 'Song not found');
  return song;
}

const fileUrl = (req, file) => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;

async function removeUploaded(files) {
  const all = Object.values(files || {}).flat();
  await Promise.all(all.map((f) => fs.unlink(f.path).catch(() => {})));
}

async function removeStoredFile(url) {
  const marker = '/uploads/';
  const idx = url ? url.indexOf(marker) : -1;
  if (idx === -1) return;
  const name = path.basename(url.slice(idx + marker.length));
  await fs.unlink(path.join(config.uploadDir, name)).catch(() => {});
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { q, genre, artist, sort, page, limit } = parse(listSchema, req.query);
    const filter = {};
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ title: rx }, { artistName: rx }, { album: rx }, { genre: rx }];
    }
    if (genre) filter.genre = genre;
    if (artist) {
      if (!mongoose.isValidObjectId(artist)) throw new HttpError(400, 'Invalid artist id');
      filter.artist = artist;
    }
    const [items, total] = await Promise.all([
      Song.find(filter).sort(SORTS[sort]).skip((page - 1) * limit).limit(limit),
      Song.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  })
);

router.get(
  '/genres',
  asyncHandler(async (_req, res) => {
    const genres = await Song.distinct('genre');
    res.json({ genres: genres.sort() });
  })
);

router.get(
  '/liked',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).populate('likedSongs');
    res.json({ items: user ? user.likedSongs.filter(Boolean) : [] });
  })
);

router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const song = await findSong(req.params.id);
    let liked = false;
    if (req.user) liked = Boolean(await User.exists({ _id: req.user.id, likedSongs: song._id }));
    res.json({ song, liked });
  })
);

router.post(
  '/',
  requireAuth,
  requireRole('artist'),
  (req, res, next) => songUpload(req, res, (err) => next(err)),
  asyncHandler(async (req, res) => {
    try {
      const data = parse(songSchema, req.body);
      const audio = req.files?.audio?.[0];
      const cover = req.files?.cover?.[0];
      if (!audio) throw new HttpError(400, 'An audio file is required');
      const artist = await User.findById(req.user.id);
      if (!artist) throw new HttpError(401, 'Account no longer exists');
      const song = await Song.create({
        ...data,
        artist: artist._id,
        artistName: artist.displayName,
        audioUrl: fileUrl(req, audio),
        coverUrl: cover ? fileUrl(req, cover) : '',
      });
      res.status(201).json({ song });
    } catch (err) {
      await removeUploaded(req.files);
      throw err;
    }
  })
);

router.patch(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const song = await findSong(req.params.id);
    if (song.artist.toString() !== req.user.id) throw new HttpError(403, 'You can only edit your own songs');
    Object.assign(song, parse(songSchema.partial(), req.body));
    await song.save();
    res.json({ song });
  })
);

router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const song = await findSong(req.params.id);
    if (song.artist.toString() !== req.user.id) throw new HttpError(403, 'You can only delete your own songs');
    await song.deleteOne();
    await User.updateMany({ likedSongs: song._id }, { $pull: { likedSongs: song._id } });
    await Promise.all([removeStoredFile(song.audioUrl), removeStoredFile(song.coverUrl)]);
    res.status(204).end();
  })
);

router.post(
  '/:id/play',
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Song not found');
    const song = await Song.findByIdAndUpdate(req.params.id, { $inc: { plays: 1 } }, { new: true });
    if (!song) throw new HttpError(404, 'Song not found');
    res.json({ plays: song.plays });
  })
);

router.post(
  '/:id/like',
  requireAuth,
  asyncHandler(async (req, res) => {
    const song = await findSong(req.params.id);
    const added = await User.updateOne(
      { _id: req.user.id, likedSongs: { $ne: song._id } },
      { $push: { likedSongs: song._id } }
    );
    let liked = true;
    if (added.modifiedCount) {
      await Song.updateOne({ _id: song._id }, { $inc: { likes: 1 } });
    } else {
      await User.updateOne({ _id: req.user.id }, { $pull: { likedSongs: song._id } });
      await Song.updateOne({ _id: song._id, likes: { $gt: 0 } }, { $inc: { likes: -1 } });
      liked = false;
    }
    res.json({ liked });
  })
);

module.exports = router;
