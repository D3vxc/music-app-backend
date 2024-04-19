const ArtistSchema = require("../Models/Artist");

const CreateArtist = async (data) => {
    console.log(data);
    try {
        const AddArtist = await ArtistSchema.create(data);
        console.log("AddArtist", AddArtist);
        return AddArtist;
    } catch (error) {
        console.log(error);
    }
};

const GetArtist = async () => {
    try {
        const GetArtist = await ArtistSchema.find({});
        return GetArtist;
    }
    catch (error) {
        console.log(error);
    }
};

const GetArtistById = async (id) => {
    try {
        const AddArtist = await ArtistSchema.findById(id);
        return AddArtist;
    }
    catch (error) {
        console.log(error);
    }
};

const UpdateArtistById = async (id, data) => {
    try {
        const updateArtist = await ArtistSchema.findById(
            { _id: id },
        );
        let updateThisArtist = await updateArtist.update({ $set: data })
        return updateThisArtist;
    }
    catch (error) {
        console.log(error)
        return error;
    }
}
// }

const DeleteArtistById = async (id, data) => {
    try {
        const deleteArtist = await ArtistSchema.findById(
            { _id: id },
        );
        let deleteThisArtist = await deleteArtist.delete({ $set: data })
        return deleteThisArtist;
    }
    catch {
        (error)
        return error;
    }
}

module.exports = {
    CreateArtist,
    GetArtist,
    GetArtistById,
    UpdateArtistById,
    DeleteArtistById
};