import express from "express";
const router = express.Router();
import { generateCron } from "../controllers/aiController.js";

router.post("/generate-cron", generateCron);

export default router;
