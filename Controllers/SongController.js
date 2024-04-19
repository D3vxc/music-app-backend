const {
    CreateSong,
    GetSong,
    DeleteSongById,
    GetSongById,
    UpdateSongById
} = require("../Services/SongService");

const AddSongController = async (req, res) => {
    try {
        const SongPost = await CreateSong(req.body);
        res.send(SongPost);
    } catch (error) {
        console.log(error);
    }
};

const GetSongController = async (req, res) => {
    try {
        const SongPost = await GetSong(req.body);
        res.send(SongPost);
    } catch (error) {
        console.log(error);
    }
};

const GetSongByIdController = async (req, res) => {
    try {
        const data = await GetSongById(req.params.id);
        res.send(data);
    } catch (error) {
        res.send(error);
    }
};

const UpdateSongByIdController = async (req, res) => {
    try {
        const data = await UpdateSongById(req.params.id, req.body);
        res.send(data);
    } catch (error) {
        res.send(error);
    }
};

const DeleteSongByIdController = async (req, res) => {
    try {
        const data = await DeleteSongById(req.params.id);
        res.send(data);
    } catch (error) {
        res.send(error);
    }
};

module.exports = {
    AddSongController,
    GetSongController,
    DeleteSongByIdController,
    GetSongByIdController,
    UpdateSongByIdController
};
