//require list
const mongoose = require('mongoose');
const express = require('express');
const cookieparser = require("cookie-parser");
const cors = require('cors');
const app = express();
const userRouters = require("./Routes/UserRouter");
const songRouters = require("./Routes/SongRoutes");
const artistRouters = require("./Routes/ArtistRoutes")
const bodyparser = require("body-parser");

app.use(express.json());
app.use(cookieparser());
app.use(bodyparser.json());

app.use(cors({
    origin: ["http://127.0.0.1:5173", "http://localhost:3001"],
})
);

app.use(bodyparser.urlencoded({
    extended: false,
}))

//connection of node and database using mongoose
// app.use("/user", userRouters);
app.get("/", (req, res) => {
    res.send("Hello")
})
app.use("/artist", artistRouters)
app.use("/user", userRouters)
app.use("/song", songRouters)
mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1:27017/music-app',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
)
    .then(() => {
        console.log("database connectd succesfully");
    })
    .catch((error) => {
        console.log("error connecting to database ", error);
    })

// listening the server at localhost:3000
app.listen(3000)