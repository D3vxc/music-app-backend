const jwt = require('jsonwebtoken');
const secretKey = "secretKey";
const {
    CreateArtist,
    GetArtist,
    GetArtistById,
    UpdateArtistById,
    DeleteArtistById
} = require("../Services/ArtistService");


const ArtistModel = require("../Models/Artist");

const CreateArtistController = async (req, res) => {
    console.log(res);
    try {
        const data = await CreateArtist(req.body);
        res.send(data);
    } catch (error) {
        res.send(error);
    }
};

const GetArtistController = async (req, res) => {
    try {
        const data = await GetArtist(req.body);
        res.send(data);
    } catch (error) {
        res.send(error);
    }
};

const GetArtistByIdController = async (req, res) => {
    try {
        const data = await GetArtistById(req.params.id);
        res.send(data);
    } catch (error) {
        res.send(error);
    }
};

const UpdateArtistByIdController = async (req, res) => {
    // console.log(req.params.id, "----------------------->this")
    try {
        const data = await UpdateArtistById(req.params.id, req.body);
        res.send(data);
    } catch (error) {
        res.send(error);
    }
};

const DeleteArtistByIdController = async (req, res) => {
    try {
        const data = await DeleteArtistById(req.params.id);
        res.send(data);
    } catch (error) {
        res.send(error);
    }
};


const ArtistLogin = async (req, res) => {
    try {
        const Artist = await ArtistModel.findOne({
            email: req.body.email,
            password: req.body.password,
        });
        if (!Artist) {
            return res.send("please check your email and password!")
        }
        const token = jwt.sign({ id: Artist._id }, secretKey);
        return res
            .cookie("access_token", token, {
                httpOnly: true,
                secure: false,
            })
            .status(200)
            .json({ message: "Artist Logged In " });
    }
    catch (error) {
        console.log(error)
    }
}

const authorization = (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) {
        return res.sendstatus(403);
    }
    try {
        const data = jwt.verify(token, secretKey);
        req.id = data.id;
        return next();
    } catch (error) {
        return res.sendstatus(403);
    }
};


module.exports = {
    CreateArtistController,
    GetArtistController,
    GetArtistByIdController,
    UpdateArtistByIdController,
    DeleteArtistByIdController,
    ArtistLogin,
    authorization
};
