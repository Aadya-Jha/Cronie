import express from 'express';
import { getSystemUsage } from '../scheduler/globalLimiter.js';
import { getUserExecutionUsage, getUserJobUsage } from '../scheduler/userLimiter.js';
import { defaultLimiter } from '../middleware/apiRateLimiter.js';
import Job from '../models/Job.js';
import Execution from '../models/Execution.js';

const router = express.Router();

router.use(defaultLimiter);

router.get('/health', (req, res) => {
  const usage = getSystemUsage();
  const healthy =
    usage.concurrent.remaining > 0 &&
    usage.throughput.remaining > 0;

  return res.status(healthy ? 200 : 503).json({
    success: true,
    status: healthy ? 'healthy' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    limits: usage,
  });
});

router.get('/stats', async (req, res) => {
  try {
    const [
      totalJobs,
      activeJobs,
      pausedJobs,
      deletedJobs,
      totalExecutions,
      successExecutions,
      failedExecutions,
      runningExecutions,
    ] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      Job.countDocuments({ status: 'paused' }),
      Job.countDocuments({ status: 'deleted' }),
      Execution.countDocuments(),
      Execution.countDocuments({ status: 'success' }),
      Execution.countDocuments({ status: 'failed' }),
      Execution.countDocuments({ status: 'running' }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        jobs: {
          total: totalJobs,
          active: activeJobs,
          paused: pausedJobs,
          deleted: deletedJobs,
        },
        executions: {
          total: totalExecutions,
          success: successExecutions,
          failed: failedExecutions,
          running: runningExecutions,
        },
        system: getSystemUsage(),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/limits/system', (req, res) => {
  return res.status(200).json({
    success: true,
    usage: getSystemUsage(),
  });
});

router.get('/limits/user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const [executionUsage, jobUsage] = await Promise.all([
      getUserExecutionUsage(userId),
      getUserJobUsage(userId),
    ]);

    return res.status(200).json({
      success: true,
      userId,
      usage: {
        executions: executionUsage,
        jobs: jobUsage,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/executions/recent', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const status = req.query.status;

  try {
    const filter = status ? { status } : {};
    const executions = await Execution.find(filter)
      .sort({ startedAt: -1 })
      .limit(limit)
      .populate('jobId', 'name targetUrl httpMethod');

    return res.status(200).json({ success: true, executions });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/jobs/overdue', async (req, res) => {
  try {
    const now = new Date();
    const jobs = await Job.find({
      status: 'active',
      nextRunAt: { $lte: now },
    }).sort({ nextRunAt: 1 });

    return res.status(200).json({ success: true, count: jobs.length, jobs });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;