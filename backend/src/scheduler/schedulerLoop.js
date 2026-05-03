import Job from "../models/Job.js";
import { executeJob, isJobAlreadyRunning } from "./executionService.js";
import { canSystemExecute, filterJobsForTick, canUserExecute, recordExecution, incrementConcurrent, decrementConcurrent } from './cronGuard.js';
import { enforceExecutionLimit } from './userLimiter.js';

export const startScheduler = () => {
  const checkJobs = async () => {
    try {
      const sysCheck = canSystemExecute();
      if (!sysCheck.allowed) {
        console.warn(`[scheduler] Skipping tick — ${sysCheck.reason}`);
        return;
      }

      const now = new Date();
      const rawJobs = await Job.find({
        status: "active",
        nextRunAt: { $lte: now },
        userId: { $exists: true, $ne: null },
      });

      const dueJobs = filterJobsForTick(rawJobs);

      for (const job of dueJobs) {
        const isRunning = await isJobAlreadyRunning(job._id);
        if (isRunning) continue;

        const userCheck = canUserExecute(job.userId);
        if (!userCheck.allowed) {
          console.warn(`[scheduler] ${userCheck.reason}`);
          continue;
        }

        incrementConcurrent();
        enforceExecutionLimit(job.userId);
        recordExecution(job.userId);
        executeJob(job).finally(decrementConcurrent);
      }
    } catch (err) {
      console.error("Scheduler error:", err.message);
    }
  };

  setInterval(checkJobs, 30000);
};