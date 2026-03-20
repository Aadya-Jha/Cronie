import {
  startExecutionTracking,
  transitionToRunning,
  updateExecutionStatus,
} from "./executionTracker.js";
import axios from "axios";
import { getNextRunTime } from "./cronHelper.js";
import Execution from "../models/Execution.js";

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
  }
};
