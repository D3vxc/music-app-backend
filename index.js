const mongoose = require("mongoose");
const config = require("./config");
const app = require("./app");

mongoose.set("strictQuery", true);

mongoose
    .connect(config.mongoUri)
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(config.port, () => console.log(`API listening on http://localhost:${config.port}`));
    })
    .catch((error) => {
        console.error("Could not connect to MongoDB:", error.message);
        process.exit(1);
    });
