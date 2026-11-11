const router = require("express").Router();
const { asyncHandler: h } = require("../Middleware/errors");
const { requireAuth } = require("../Middleware/auth");
const c = require("../Controllers/LibraryController");

router.get("/search", h(c.search));
router.get("/playlists/:id", h(c.getPlaylist)); // public playlists are viewable while logged out

router.get("/me/likes", requireAuth, h(c.likedSongs));
router.get("/me/likes/ids", requireAuth, h(c.likedIds));
router.put("/me/likes/:songId", requireAuth, h(c.like));
router.delete("/me/likes/:songId", requireAuth, h(c.unlike));

router.get("/me/follows", requireAuth, h(c.followedArtists));
router.put("/me/follows/:artistId", requireAuth, h(c.follow));
router.delete("/me/follows/:artistId", requireAuth, h(c.unfollow));

router.get("/playlists", requireAuth, h(c.myPlaylists));
router.post("/playlists", requireAuth, h(c.createPlaylist));
router.patch("/playlists/:id", requireAuth, h(c.updatePlaylist));
router.delete("/playlists/:id", requireAuth, h(c.deletePlaylist));
router.post("/playlists/:id/songs", requireAuth, h(c.addToPlaylist));
router.delete("/playlists/:id/songs/:songId", requireAuth, h(c.removeFromPlaylist));

module.exports = router;
