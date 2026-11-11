require("dotenv").config();

const config = {
    port: Number(process.env.PORT) || 3000,
    mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/music-app",
    jwtSecret: process.env.JWT_SECRET,
    clientOrigin: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(","),
    isProd: process.env.NODE_ENV === "production",
};

if (!config.jwtSecret) {
    if (config.isProd) throw new Error("JWT_SECRET must be set in production");
    config.jwtSecret = "dev-only-secret-do-not-use-in-production";
    console.warn("[config] JWT_SECRET not set - using an insecure development secret");
}

module.exports = config;
