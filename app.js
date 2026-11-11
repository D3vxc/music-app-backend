const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const config = require("./config");
const { readSession } = require("./Middleware/auth");
const { errorHandler } = require("./Middleware/errors");
const { UPLOAD_ROOT } = require("./Middleware/upload");

const app = express();
app.disable("x-powered-by");

app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(readSession);

// Uploaded audio/images. express.static supports HTTP Range requests, so seeking works.
app.use("/uploads", express.static(UPLOAD_ROOT, { maxAge: "7d", fallthrough: false }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", require("./Routes/AuthRoutes"));
app.use("/api/songs", require("./Routes/SongRoutes"));
app.use("/api/artists", require("./Routes/ArtistRoutes"));
app.use("/api", require("./Routes/LibraryRoutes"));

app.use("/api", (_req, res) => res.status(404).json({ message: "Not found" }));
app.use(errorHandler);

module.exports = app;
