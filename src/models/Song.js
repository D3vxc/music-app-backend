const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    artistName: { type: String, required: true, trim: true },
    album: { type: String, trim: true, default: '' },
    genre: { type: String, trim: true, lowercase: true, default: 'other', index: true },
    durationSec: { type: Number, min: 0, default: 0 },
    audioUrl: { type: String, required: true },
    coverUrl: { type: String, default: '' },
    plays: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SongSchema.index({ title: 'text', artistName: 'text', album: 'text', genre: 'text' });

SongSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Song', SongSchema);
