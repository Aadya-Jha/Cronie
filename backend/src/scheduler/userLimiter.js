import { USER_LIMITS } from '../config/rateLimitConfig.js';
import Job from '../models/Job.js';

const executionBuckets = new Map();

function getBucket(userId) {
  const now = Date.now();
  const windowStart = now - USER_LIMITS.EXECUTION_WINDOW_MS;

  if (!executionBuckets.has(userId)) {
    executionBuckets.set(userId, []);
  }

  const pruned = executionBuckets.get(userId).filter(t => t > windowStart);
  executionBuckets.set(userId, pruned);
  return pruned;
}

export function isUserExecutionAllowed(userId) {
  const bucket = getBucket(userId);
  return bucket.length < USER_LIMITS.MAX_EXECUTIONS_PER_MINUTE;
}

export function trackUserExecution(userId) {
  const bucket = getBucket(userId);
  bucket.push(Date.now());
  executionBuckets.set(userId, bucket);
}

export function getUserExecutionUsage(userId) {
  const bucket = getBucket(userId);
  return {
    used: bucket.length,
    limit: USER_LIMITS.MAX_EXECUTIONS_PER_MINUTE,
    remaining: Math.max(0, USER_LIMITS.MAX_EXECUTIONS_PER_MINUTE - bucket.length),
    windowMs: USER_LIMITS.EXECUTION_WINDOW_MS,
  };
}

export async function isUserJobLimitReached(userId) {
  const count = await Job.countDocuments({ userId, status: { $ne: 'deleted' } });
  return count >= USER_LIMITS.MAX_JOBS_PER_USER;
}

export async function getUserJobUsage(userId) {
  const count = await Job.countDocuments({ userId, status: { $ne: 'deleted' } });
  return {
    used: count,
    limit: USER_LIMITS.MAX_JOBS_PER_USER,
    remaining: Math.max(0, USER_LIMITS.MAX_JOBS_PER_USER - count),
  };
}

export function enforceExecutionLimit(userId) {
  if (!isUserExecutionAllowed(userId)) {
    const usage = getUserExecutionUsage(userId);
    const error = new Error(
      `Execution rate limit exceeded. You have used ${usage.used}/${usage.limit} executions in the current window.`
    );
    error.statusCode = 429;
    error.code = 'USER_EXECUTION_LIMIT';
    throw error;
  }
  trackUserExecution(userId);
}

export async function enforceJobLimit(userId) {
  const reached = await isUserJobLimitReached(userId);
  if (reached) {
    const error = new Error(
      `Job limit reached. You cannot have more than ${USER_LIMITS.MAX_JOBS_PER_USER} active jobs.`
    );
    error.statusCode = 429;
    error.code = 'USER_JOB_LIMIT';
    throw error;
  }
}

export function userExecutionLimiterMiddleware(req, res, next) {
  const userId = req.user?._id?.toString() ?? req.user?.id?.toString();

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized.' });
  }

  if (!isUserExecutionAllowed(userId)) {
    const usage = getUserExecutionUsage(userId);
    return res.status(429).json({
      success: false,
      error: 'Execution rate limit exceeded.',
      usage,
    });
  }

  trackUserExecution(userId);
  next();
}

export async function userJobLimitMiddleware(req, res, next) {
  const userId = req.user?._id?.toString() ?? req.user?.id?.toString();

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized.' });
  }

  try {
    await enforceJobLimit(userId);
    next();
  } catch (err) {
    return res.status(err.statusCode ?? 500).json({
      success: false,
      error: err.message,
      code: err.code ?? 'INTERNAL_ERROR',
    });
  }
}

export function clearUserBucket(userId) {
  executionBuckets.delete(userId);
}

export function resetAllBuckets() {
  executionBuckets.clear();
}