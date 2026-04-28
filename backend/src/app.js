import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import adminRouter from './routes/admin.js';
import jobRouter from "./routes/jobs.js";
import aiRouter from "./routes/ai.js";
import { aiRateLimiter } from "./middleware/rateLimiter.js";
import { defaultLimiter, rateLimitErrorHandler } from './middleware/apiRateLimiter.js';
import authRoutes from "./routes/auth.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use('/auth', authRoutes);
app.use(express.static(path.join(__dirname, "public")));
app.use('/admin', defaultLimiter, adminRouter);
app.use('/jobs', defaultLimiter, jobRouter);
app.use('/ai', defaultLimiter, aiRateLimiter, aiRouter);
app.use(rateLimitErrorHandler);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

export default app;