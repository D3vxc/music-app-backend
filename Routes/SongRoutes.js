const router = require("express").Router();
const { asyncHandler: h } = require("../Middleware/errors");
const { requireArtist } = require("../Middleware/auth");
const { upload, enforceImageSize } = require("../Middleware/upload");
const c = require("../Controllers/SongController");

const songFiles = upload.fields([{ name: "audio", maxCount: 1 }, { name: "cover", maxCount: 1 }]);

router.get("/", h(c.listSongs));
router.get("/genres", h(c.genres));
router.get("/:id", h(c.getSong));
router.post("/", requireArtist, songFiles, enforceImageSize, h(c.createSong));
router.patch("/:id", requireArtist, songFiles, enforceImageSize, h(c.updateSong));
router.delete("/:id", requireArtist, h(c.deleteSong));
router.post("/:id/play", h(c.recordPlay));

module.exports = router;
