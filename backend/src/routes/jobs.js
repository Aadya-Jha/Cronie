import express from "express";
const router = express.Router();
import { getJobs, getJob, createJob, pauseJob, resumeJob, updateJob, deleteJob, getExecutionHistory } from "../controllers/jobController.js";
import { jobCreationLimiter, jobReadLimiter, jobUpdateLimiter, jobDeleteLimiter, jobPauseResumeLimiter } from '../middleware/apiRateLimiter.js';
import { userJobLimitMiddleware } from '../scheduler/userLimiter.js';
import { assertCronSafe } from '../scheduler/cronGuard.js';
import rateLimit from 'express-rate-limit';
import { JOB_CREATION_RATE_LIMIT_OPTIONS } from '../config/rateLimitConfig.js';

function cronGuardMiddleware(req, res, next) {
  try {
    assertCronSafe(req.body.cronExpression);
    next();
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

router.post("/", rateLimit(JOB_CREATION_RATE_LIMIT_OPTIONS), jobCreationLimiter, userJobLimitMiddleware, cronGuardMiddleware, createJob);
router.get("/",  jobReadLimiter, getJobs);
router.get("/:id/executions", getExecutionHistory);
router.get("/:id", jobReadLimiter, getJob);
router.patch("/:id/pause", jobPauseResumeLimiter, pauseJob);
router.patch("/:id/resume", jobPauseResumeLimiter, resumeJob);
router.put("/:id", jobUpdateLimiter, updateJob);
router.delete("/:id", jobDeleteLimiter, deleteJob);

export default router;
