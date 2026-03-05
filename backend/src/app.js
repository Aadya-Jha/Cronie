import express from "express";
const app = express();
import jobRouter from "./routes/jobs.js";

app.use(express.json());
app.use("/jobs", jobRouter);

export default app;