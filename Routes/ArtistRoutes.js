const router = require("express").Router();
const { asyncHandler: h } = require("../Middleware/errors");
const { requireArtist } = require("../Middleware/auth");
const { upload, enforceImageSize } = require("../Middleware/upload");
const c = require("../Controllers/ArtistController");

router.get("/", h(c.listArtists));
router.get("/me/stats", requireArtist, h(c.myStats));
router.patch("/me", requireArtist, upload.single("image"), enforceImageSize, h(c.updateMe));
router.get("/:id", h(c.getArtist));

module.exports = router;
