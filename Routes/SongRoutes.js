const router = require("express").Router();
const {
    AddSongController,
    GetSongController,
    DeleteSongByIdController,
    GetSongByIdController,
    UpdateSongByIdController
} = require("../Controllers/SongController");

router.post("/add", AddSongController);
router.get("/get", GetSongController);
router.get("/get/:id", GetSongByIdController);
router.put("/update/:id", UpdateSongByIdController);
router.delete("/delete/:id", DeleteSongByIdController);

module.exports = router;