const SongSchema = require("../Models/Song");

const CreateSong = async (data) => {
    // console.log(data);
    try {
        const AddSong = await SongSchema.create(data);
        return AddSong;
    } catch (error) {
        console.log(error);
    }
};

const GetSong = async () => {
    try {
        const GetSong = await SongSchema.find({});
        return GetSong;
    } catch (error) {
        console.log(error);
    }
};

const GetSongById = async (id) => {
    try {
        const FindSong = await SongSchema.findById(id);
        return FindSong;
    }
    catch (error) {
        console.log(error);
    }
};

const UpdateSongById = async (id, data) => {
    try {
        const Findsong = await SongSchema.findById(
            { _id: id },
        );
        let UpdateThisSong = await Findsong.update({ $set: data })
        return UpdateThisSong;
    }
    catch (error) {
        console.log(error)
        return error;
    }
}

const DeleteSongById = async (id, data) => {
    try {
        const Deletesong = await SongSchema.findById(
            { _id: id },
        );
        let DeleteThisSong = await Deletesong.delete({ $set: data })
        return DeleteThisSong;
    }
    catch (error) {
        return error;
    }
}

module.exports = {
    CreateSong,
    GetSong,
    DeleteSongById,
    GetSongById,
    UpdateSongById
};