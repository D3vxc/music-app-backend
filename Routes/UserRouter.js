const router = require("express").Router();
const {
    CreateUserController,
    GetUserController,
    GetUserByIdController,
    UpdateUserByIdController,
    DeleteUserByIdController,
    authorization,
    UserLogin
} = require("../Controllers/UserController");

router.post("/add", CreateUserController);
router.get("/get", GetUserController);
router.get("/get/:id", GetUserByIdController);
router.put("/update/:id", UpdateUserByIdController);
router.delete("/delete/:id", DeleteUserByIdController);
router.post("/userlogin", UserLogin);

router.get("/userlogout", authorization, (req, res) => {
    return res
        .clearCookie("access_token")
        .status(200)
        .json({ message: "Logged Out" });
});

module.exports = router;













        // router.put("/update/:id", async (req, res) => {
        //     try {
        //         const updateUSer = await User.findByIdAndUpdate(req.params.id, req.body);
        //         res.send(updateUSer);
        //     } catch (error) {
        //         // console.log(error)
        //         res.status(403).send(updateUSer);
        //     }
        // });