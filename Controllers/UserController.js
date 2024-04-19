const jwt = require('jsonwebtoken');
const secretKey = "secretKey";
const {
    CreateUser,
    GetUser,
    GetUserById,
    UpdateUserById,
    DeleteUserById
} = require("../Services/UserServices");

const UserSchema = require("../Models/User");

const CreateUserController = async (req, res) => {
    console.log(res);
    try {
        const data = await CreateUser(req.body);
        res.send(data);
    } catch (error) {
        res.send(error);
    }
};

const GetUserController = async (req, res) => {
    try {
        const data = await GetUser(req.body);
        res.send(data);
    } catch (error) {
        res.send(error);
    }
};

const GetUserByIdController = async (req, res) => {
    try {
        const data = await GetUserById(req.params.id);
        res.send(data);
    } catch (error) {
        res.send(error);
    }
};

const UpdateUserByIdController = async (req, res) => {
    // console.log(req.params.id, "----------------------->this")
    try {
        const data = await UpdateUserById(req.params.id, req.body);
        res.send(data);
    } catch (error) {
        res.send(error);
    }
};

const DeleteUserByIdController = async (req, res) => {
    try {
        const data = await DeleteUserById(req.params.id);
        res.send(data);
    } catch (error) {
        res.send(error);
    }
};

const UserLogin = async (req, res) => {
    console.log("---------->", req.body.email, req.body.password);
    try {
        const User = await UserSchema.findOne({
            username: req.body.username,
            password: req.body.password,

        });
        if (!User) {
            return res.send("User does not exist, please check your username and password");
        }
        const token = jwt.sign({ id: User._id }, secretKey);
        return res
            .cookie("access_token", token, {
                httpOnly: true,
                secure: false,
            })
            .status(200)
            .json({ message: "User Logged In " });
    } catch (error) {
        console.log(error);
    }
};

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
    CreateUserController,
    GetUserController,
    GetUserByIdController,
    UpdateUserByIdController,
    DeleteUserByIdController,
    UserLogin,
    authorization
};
