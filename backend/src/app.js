import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import adminRouter from './routes/admin.js';
import jobRouter from "./routes/jobs.js";
import aiRouter from "./routes/ai.js";
import { aiRateLimiter } from "./middleware/rateLimiter.js";
import { defaultLimiter, rateLimitErrorHandler } from './middleware/apiRateLimiter.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(defaultLimiter);
app.use(rateLimitErrorHandler);
app.use('/admin', adminRouter);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/jobs", jobRouter);
app.use("/ai", aiRateLimiter, aiRouter);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

export default app;
