# Pulse API

REST API for **Pulse**, a music streaming app: accounts, artist uploads, search, likes, play counts and playlists.
Frontend: [music-app-frontend](https://github.com/D3vxc/music-app-frontend).

**Stack:** Node.js 18+, Express, MongoDB/Mongoose, JWT, bcrypt, Zod, Multer.

## Run locally

```bash
cp .env.example .env      # then edit values
npm install
npm run dev               # http://localhost:3000/api/health
```

Needs MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string in `MONGODB_URI`.

## Tests

```bash
npm test                  # uses MongoDB on 127.0.0.1:27017 (or TEST_MONGODB_URI)
```

Tests create and drop their own database. CI runs them against a MongoDB service container.

## API

All responses are JSON. Authenticated routes need `Authorization: Bearer <token>`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | – | Health + DB status |
| POST | `/api/auth/register` | – | `{displayName, username, email, password, role: listener\|artist}` → `{user, token}` |
| POST | `/api/auth/login` | – | `{identifier (username or email), password}` → `{user, token}` |
| GET | `/api/auth/me` | ✔ | Current user |
| GET | `/api/songs` | – | `?q=&genre=&artist=&sort=new\|popular\|title&page=&limit=` |
| GET | `/api/songs/genres` | – | Distinct genres |
| GET | `/api/songs/liked` | ✔ | Your liked songs |
| GET | `/api/songs/:id` | optional | Song (+ `liked` if signed in) |
| POST | `/api/songs` | artist | multipart: `title, album?, genre?, durationSec?, audio (file), cover? (file)` |
| PATCH / DELETE | `/api/songs/:id` | owner | Edit / delete your song (deletes stored files) |
| POST | `/api/songs/:id/play` | – | Increment play count |
| POST | `/api/songs/:id/like` | ✔ | Toggle like |
| GET / POST | `/api/playlists` | ✔ | List / create your playlists |
| GET | `/api/playlists/:id` | optional | Public, or private if you own it |
| PATCH / DELETE | `/api/playlists/:id` | owner | Update / delete |
| POST | `/api/playlists/:id/songs` | owner | `{songId}` (no duplicates) |
| DELETE | `/api/playlists/:id/songs/:songId` | owner | Remove song |

## Security

- Passwords hashed with bcrypt (cost 12), never returned by the API.
- JWT secret from env; startup fails in production if it is missing.
- Login uses one error message for unknown user and wrong password (no account enumeration).
- Rate-limited auth routes, Helmet headers, CORS allow-list, 100 KB JSON limit.
- Uploads: MIME allow-list, size limit, random filenames; files deleted when an upload fails or a song is removed.
- Search input is regex-escaped.

## Deploy

GitHub Pages can only host static files, so the API needs a Node host. Easiest free path:

1. Create a free cluster on MongoDB Atlas and copy its connection string.
2. On Render: **New → Blueprint**, pick this repo (uses `render.yaml`), paste `MONGODB_URI`.
3. Put the resulting URL (e.g. `https://pulse-api.onrender.com`) in the frontend's `VITE_API_URL`.

Note: Render's free disk is ephemeral, so uploaded audio is lost on redeploy. For real use, move uploads to S3/Cloudinary.
