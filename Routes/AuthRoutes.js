const router = require("express").Router();
const { asyncHandler: h } = require("../Middleware/errors");
const c = require("../Controllers/AuthController");

router.post("/register", h(c.registerUser));
router.post("/register/artist", h(c.registerArtist));
router.post("/login", h(c.login));
router.post("/logout", c.logout);
router.get("/me", h(c.me));

module.exports = router;
