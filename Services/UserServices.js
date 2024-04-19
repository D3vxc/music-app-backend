const UserSchema = require("../Models/User");

const CreateUser = async (data) => {
    console.log(data);
    try {
        const AddUser = await UserSchema.create(data);
        console.log("AddUser", AddUser);
        return AddUser;
    } catch (error) {
        console.log(error);
    }
};

const GetUser = async () => {
    try {
        const GetUser = await UserSchema.find({});
        return GetUser;
    }
    catch (error) {
        console.log(error);
    }
};

const GetUserById = async (id) => {
    try {
        const AddUser = await UserSchema.findById(id);
        return AddUser;
    }
    catch (error) {
        console.log(error);
    }
};

const UpdateUserById = async (id, data) => {
    try {
        const finduser = await UserSchema.findById(
            { _id: id },
        );
        let updateThisUser = await finduser.update({ $set: data })
        return updateThisUser;
    }
    catch (error) {
        console.log(error)
        return error;
    }
}

const DeleteUserById = async (id, data) => {
    try {
        const deleteuser = await UserSchema.findById(
            { _id: id },
        );
        let deleteThisUser = await deleteuser.delete({ $set: data })
        return deleteThisUser;
    }
    catch {
        (error)
        return error;
    }
}
module.exports = {
    CreateUser,
    GetUser,
    GetUserById,
    UpdateUserById,
    DeleteUserById
};