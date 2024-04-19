const router = require("express").Router();
const {
    CreateArtistController,
    GetArtistController,
    GetArtistByIdController,
    UpdateArtistByIdController,
    DeleteArtistByIdController,
    authorization,
    ArtistLogin
} = require("../Controllers/ArtistController");


router.post("/add", CreateArtistController);
router.get("/get", GetArtistController);
router.get("/get/:id", GetArtistByIdController);
router.put("/update/:id", UpdateArtistByIdController);
router.delete("/delete/:id", DeleteArtistByIdController);
router.post("/Artistlogin", ArtistLogin);

router.get("/Artistlogout", authorization, (req, res) => {
    return res
        .clearCookie("access_token")
        .status(200)
        .json({ message: "Logged Out" });
});

module.exports = router;
