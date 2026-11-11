const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-uploads-'));
process.env.UPLOAD_DIR = uploadDir;
process.env.JWT_SECRET = 'test-secret';
const dbName = `pulse_test_${process.pid}`;
const mongoUri = process.env.TEST_MONGODB_URI || `mongodb://127.0.0.1:27017/${dbName}`;

const mongoose = require('mongoose');
const request = require('supertest');
const { createApp } = require('../src/app');

const app = createApp();
const api = () => request(app);
const auth = (token) => ({ Authorization: `Bearer ${token}` });
// minimal valid WAV header + a few silent samples
const wav = Buffer.concat([
  Buffer.from('RIFF'), Buffer.from([36 + 8, 0, 0, 0]), Buffer.from('WAVEfmt '),
  Buffer.from([16, 0, 0, 0, 1, 0, 1, 0, 0x40, 0x1f, 0, 0, 0x80, 0x3e, 0, 0, 2, 0, 16, 0]),
  Buffer.from('data'), Buffer.from([8, 0, 0, 0]), Buffer.alloc(8),
]);

let listener, artist, otherArtist;

async function register(body) {
  const res = await api().post('/api/auth/register').send(body);
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body;
}

before(async () => {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  await mongoose.connection.dropDatabase();
  await Promise.all(mongoose.modelNames().map((m) => mongoose.model(m).syncIndexes()));
  listener = await register({ displayName: 'Lia', username: 'lia', email: 'lia@example.com', password: 'password123' });
  artist = await register({ displayName: 'Nova Waves', username: 'nova', email: 'nova@example.com', password: 'password123', role: 'artist' });
  otherArtist = await register({ displayName: 'Other', username: 'other', email: 'o@example.com', password: 'password123', role: 'artist' });
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  fs.rmSync(uploadDir, { recursive: true, force: true });
});

test('health endpoint reports db status', async () => {
  const res = await api().get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.db, 'up');
});

test('passwords are hashed and never returned', async () => {
  assert.equal(listener.user.passwordHash, undefined);
  const raw = await mongoose.connection.collection('users').findOne({ username: 'lia' });
  assert.notEqual(raw.passwordHash, 'password123');
  assert.match(raw.passwordHash, /^\$2[aby]\$/);
});

test('register rejects duplicates and bad input', async () => {
  const dup = await api().post('/api/auth/register').send({ displayName: 'X', username: 'LIA', email: 'new@example.com', password: 'password123' });
  assert.equal(dup.status, 409);
  const bad = await api().post('/api/auth/register').send({ displayName: '', username: 'a', email: 'nope', password: 'short' });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.details.length >= 3);
});

test('login works with username or email and rejects wrong password', async () => {
  const byName = await api().post('/api/auth/login').send({ identifier: 'lia', password: 'password123' });
  assert.equal(byName.status, 200);
  assert.ok(byName.body.token);
  const byEmail = await api().post('/api/auth/login').send({ identifier: 'LIA@example.com', password: 'password123' });
  assert.equal(byEmail.status, 200);
  const wrong = await api().post('/api/auth/login').send({ identifier: 'lia', password: 'wrongpass' });
  assert.equal(wrong.status, 401);
  const unknown = await api().post('/api/auth/login').send({ identifier: 'ghost', password: 'wrongpass' });
  assert.equal(unknown.status, 401);
  assert.equal(unknown.body.error, wrong.body.error);
});

test('/me requires a valid token', async () => {
  assert.equal((await api().get('/api/auth/me')).status, 401);
  assert.equal((await api().get('/api/auth/me').set(auth('garbage'))).status, 401);
  const me = await api().get('/api/auth/me').set(auth(listener.token));
  assert.equal(me.status, 200);
  assert.equal(me.body.user.username, 'lia');
});

let songId;

test('only artists can upload, and audio is required', async () => {
  const asListener = await api().post('/api/songs').set(auth(listener.token)).field('title', 'Nope').attach('audio', wav, 'a.wav');
  assert.equal(asListener.status, 403);
  const noAudio = await api().post('/api/songs').set(auth(artist.token)).field('title', 'No audio');
  assert.equal(noAudio.status, 400);
  const badType = await api().post('/api/songs').set(auth(artist.token)).field('title', 'Bad').attach('audio', Buffer.from('hi'), { filename: 'a.txt', contentType: 'text/plain' });
  assert.equal(badType.status, 400);
});

test('artist uploads a song and file is served', async () => {
  const res = await api()
    .post('/api/songs')
    .set(auth(artist.token))
    .field('title', 'Midnight Drive')
    .field('genre', 'Synthwave')
    .field('durationSec', '1')
    .attach('audio', wav, { filename: 'track.wav', contentType: 'audio/wav' });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.equal(res.body.song.artistName, 'Nova Waves');
  assert.equal(res.body.song.genre, 'synthwave');
  songId = res.body.song.id;
  const filePath = new URL(res.body.song.audioUrl).pathname;
  const file = await api().get(filePath);
  assert.equal(file.status, 200);
  assert.equal((await api().get('/api/songs/' + songId)).status, 200);
});

test('search, filter and genres', async () => {
  const hit = await api().get('/api/songs?q=midnight');
  assert.equal(hit.body.total, 1);
  const regexSafe = await api().get('/api/songs?q=' + encodeURIComponent('(.*'));
  assert.equal(regexSafe.status, 200);
  assert.equal(regexSafe.body.total, 0);
  const byGenre = await api().get('/api/songs?genre=synthwave');
  assert.equal(byGenre.body.items[0].id, songId);
  const genres = await api().get('/api/songs/genres');
  assert.deepEqual(genres.body.genres, ['synthwave']);
});

test('play counter and like toggle', async () => {
  await api().post(`/api/songs/${songId}/play`);
  const played = await api().post(`/api/songs/${songId}/play`);
  assert.equal(played.body.plays, 2);
  assert.equal((await api().post(`/api/songs/${songId}/like`)).status, 401);
  const like = await api().post(`/api/songs/${songId}/like`).set(auth(listener.token));
  assert.equal(like.body.liked, true);
  const liked = await api().get('/api/songs/liked').set(auth(listener.token));
  assert.equal(liked.body.items.length, 1);
  const detail = await api().get('/api/songs/' + songId).set(auth(listener.token));
  assert.equal(detail.body.liked, true);
  assert.equal(detail.body.song.likes, 1);
  const unlike = await api().post(`/api/songs/${songId}/like`).set(auth(listener.token));
  assert.equal(unlike.body.liked, false);
});

test('playlists are private to their owner', async () => {
  const created = await api().post('/api/playlists').set(auth(listener.token)).send({ name: 'Road trip' });
  assert.equal(created.status, 201);
  const id = created.body.playlist.id;
  const added = await api().post(`/api/playlists/${id}/songs`).set(auth(listener.token)).send({ songId });
  assert.equal(added.body.playlist.songs.length, 1);
  const again = await api().post(`/api/playlists/${id}/songs`).set(auth(listener.token)).send({ songId });
  assert.equal(again.body.playlist.songs.length, 1, 'no duplicates');
  assert.equal((await api().get(`/api/playlists/${id}`)).status, 404);
  assert.equal((await api().delete(`/api/playlists/${id}`).set(auth(artist.token))).status, 403);
  const own = await api().get(`/api/playlists/${id}`).set(auth(listener.token));
  assert.equal(own.body.playlist.songs[0].title, 'Midnight Drive');
  await api().patch(`/api/playlists/${id}`).set(auth(listener.token)).send({ isPublic: true });
  assert.equal((await api().get(`/api/playlists/${id}`)).status, 200);
  const removed = await api().delete(`/api/playlists/${id}/songs/${songId}`).set(auth(listener.token));
  assert.equal(removed.body.playlist.songs.length, 0);
});

test('only the owning artist can edit or delete a song', async () => {
  assert.equal((await api().patch('/api/songs/' + songId).set(auth(otherArtist.token)).send({ title: 'Hijack' })).status, 403);
  const edit = await api().patch('/api/songs/' + songId).set(auth(artist.token)).send({ title: 'Midnight Drive (Remix)' });
  assert.equal(edit.body.song.title, 'Midnight Drive (Remix)');
  assert.equal((await api().delete('/api/songs/' + songId).set(auth(otherArtist.token))).status, 403);
  assert.equal((await api().delete('/api/songs/' + songId).set(auth(artist.token))).status, 204);
  assert.equal((await api().get('/api/songs/' + songId)).status, 404);
  assert.deepEqual(fs.readdirSync(uploadDir), [], 'uploaded file removed');
});

test('bad ids and unknown routes return clean 404/400s', async () => {
  assert.equal((await api().get('/api/songs/not-an-id')).status, 404);
  assert.equal((await api().get('/api/nope')).status, 404);
  assert.equal((await api().get('/uploads/missing.mp3')).status, 404);
  const malformed = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
  assert.equal(malformed.status, 400);
});
