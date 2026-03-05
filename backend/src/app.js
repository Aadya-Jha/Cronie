const express = require("express");
const app = express();

app.use(express.json());
app.use("/jobs", require("./routes/jobs"));

module.exports = app;
