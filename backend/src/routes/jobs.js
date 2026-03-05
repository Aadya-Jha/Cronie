import express from "express";
const router = express.Router();
import { createJob, pauseJob, resumeJob, updateJob, deleteJob } from "../controllers/jobController.js";

router.post("/", createJob);
router.patch("/:id/pause", pauseJob);
router.patch("/:id/resume", resumeJob);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

export default router;