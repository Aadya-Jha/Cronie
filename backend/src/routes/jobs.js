import express from "express";
const router = express.Router();
import {
  getJobs,
  getJob,
  createJob,
  pauseJob,
  resumeJob,
  updateJob,
  deleteJob,
  getExecutionHistory,
} from "../controllers/jobController.js";

router.post("/", createJob);
router.get("/", getJobs);
router.get("/:id/executions", getExecutionHistory);
router.get("/:id", getJob);
router.patch("/:id/pause", pauseJob);
router.patch("/:id/resume", resumeJob);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

export default router;
