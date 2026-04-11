import { startExecutionTracking, transitionToRunning, updateExecutionStatus } from "./executionTracker.js";
import axios from "axios";
import { getNextRunTime } from "./cronHelper.js";
import Execution from "../models/Execution.js";
import { enforceExecutionLimit } from './userLimiter.js';
import { acquireSlot, releaseSlot, canDispatch } from './globalLimiter.js';
import { canUserExecute, recordExecution } from './cronGuard.js';

export const isJobAlreadyRunning = async (jobId) => {
  try {
    const runningExecution = await Execution.findOne({
      jobId,
      status: "running",
    });
    return !!runningExecution;
  } catch (error) {
    console.error(`Error checking job running status: ${error.message}`);
    return false;
  }
};

export const executeJob = async (job) => {
  const executionId = await startExecutionTracking(job._id);
   try {
    enforceExecutionLimit(job.userId);
  } catch (err) {
    console.warn(`[executionService] Blocked job ${job._id} — ${err.message}`);
    return;
  }

  const systemCheck = canDispatch();
    if (!systemCheck.allowed) {
      console.warn(`[executionService] System rate limit — skipping job ${job._id}`);
      return;
    }

  const userId = job.userId?.toString();
  if (userId) {
    const userCheck = canUserExecute(userId);
    if (!userCheck.allowed) {
      console.warn(`[executionService] User rate limit — skipping job ${job._id}`);
      return;
    }
  }

  try {
    acquireSlot();
  } catch (err) {
    console.warn(`[executionService] Concurrency limit — skipping job ${job._id}`);
    return;
  }

  try {
    await transitionToRunning(executionId);

    await axios({
      method: job.httpMethod,
      url: job.targetUrl,
      timeout: 10000,
    });

    await updateExecutionStatus(executionId, "completed");
    const nextRunAt = getNextRunTime(job.cronExpression);
    job.nextRunAt = nextRunAt;
    job.lastRunAt = new Date();
    job.lastRunStatus = "completed";
    await job.save();
  } catch (error) {
    await updateExecutionStatus(executionId, "failed", error.message);
    job.lastRunAt = new Date();
    job.lastRunStatus = "failed";
    job.lastError = error.message;
    job.nextRunAt = getNextRunTime(job.cronExpression);
    await job.save();
  } finally {
    releaseSlot();
  }
};
