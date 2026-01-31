require("dotenv").config();

const connectDB = require("./config/db");

connectDB();

console.log("Server startup complete");
