# Music App - API

Express + MongoDB backend for an ad-free music streaming app. Artists upload songs, listeners stream them, like them, follow artists and build playlists. No subscriptions, no ads, no skip limits.

## Run it

Requires Node 18+ and a running MongoDB.

```bash
npm install
cp .env.example .env   # then set JWT_SECRET to a long random string
npm run dev            # http://localhost:3000
```

Uploaded audio and images are stored in `uploads/` and served from `/uploads/...` with HTTP Range support, so seeking works.

## API

All routes are under `/api`. Auth is an httpOnly cookie set by register/login.

| Method | Path | Who | What |
| --- | --- | --- | --- |
| POST | `/auth/register` | anyone | Listener sign-up `{name, username, email, password}` |
| POST | `/auth/register/artist` | anyone | Artist sign-up `{name, email, password, bio?}` |
| POST | `/auth/login` | anyone | `{identifier, password}` - email or username |
| POST | `/auth/logout` | anyone | Clears the session |
| GET | `/auth/me` | anyone | Current account or `null` |
| GET | `/songs?q=&genre=&artist=&sort=new\|popular&limit=` | anyone | List songs |
| GET | `/songs/genres` | anyone | Genres with counts |
| GET | `/songs/:id` | anyone | One song |
| POST | `/songs` | artist | Multipart: `audio` (required), `cover`, `title`, `album`, `genre`, `duration` |
| PATCH | `/songs/:id` | owning artist | Multipart: `title`, `album`, `genre`, `cover` |
| DELETE | `/songs/:id` | owning artist | Deletes the song, its files, likes and playlist entries |
| POST | `/songs/:id/play` | anyone | Increments play count (the client calls this after 30s of listening) |
| GET | `/artists` / `/artists/:id` | anyone | Artist list / profile with songs, followers and total plays |
| GET | `/artists/me/stats` | artist | Dashboard: plays, likes, followers, per-song stats |
| PATCH | `/artists/me` | artist | Multipart: `name`, `bio`, `image` |
| GET | `/search?q=` | anyone | Songs, artists and public playlists |
| GET/PUT/DELETE | `/me/likes`, `/me/likes/ids`, `/me/likes/:songId` | logged in | Liked Songs |
| GET/PUT/DELETE | `/me/follows`, `/me/follows/:artistId` | logged in | Followed artists |
| GET/POST | `/playlists` | logged in | Your playlists / create |
| GET | `/playlists/:id` | anyone (public) / owner (private) | One playlist |
| PATCH/DELETE | `/playlists/:id` | owner | Rename, describe, make public/private, delete |
| POST/DELETE | `/playlists/:id/songs`, `/playlists/:id/songs/:songId` | owner | Add/remove songs |

## Security notes

- Passwords are hashed with bcrypt and never returned.
- Uploads are checked by MIME type, renamed to random filenames, and size-limited (audio 50 MB, images 5 MB).
- Before deploying publicly, add rate limiting to `/auth/login`, serve over HTTPS (cookies become `secure` when `NODE_ENV=production`), and move uploads to object storage (S3/R2) if you run more than one server.
