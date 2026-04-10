import {
  USER_LIMITS,
  GLOBAL_LIMITS,
  validateCronSafety,
} from '../config/rateLimitConfig.js';
import { CronExpressionParser } from 'cron-parser';

const userExecutionLog = new Map();
let concurrentJobCount = 0;
let systemExecutionLog = [];

function getUserExecutionCount(userId) {
  const now = Date.now();
  const windowStart = now - USER_LIMITS.EXECUTION_WINDOW_MS;
  const timestamps = (userExecutionLog.get(userId) || []).filter(t => t > windowStart);
  userExecutionLog.set(userId, timestamps);
  return timestamps.length;
}

function recordUserExecution(userId) {
  const timestamps = userExecutionLog.get(userId) || [];
  timestamps.push(Date.now());
  userExecutionLog.set(userId, timestamps);
}

function getSystemExecutionCount() {
  const now = Date.now();
  const windowStart = now - 60_000;
  systemExecutionLog = systemExecutionLog.filter(t => t > windowStart);
  return systemExecutionLog.length;
}

function recordSystemExecution() {
  systemExecutionLog.push(Date.now());
}

export function incrementConcurrent() {
  concurrentJobCount++;
}

export function decrementConcurrent() {
  if (concurrentJobCount > 0) concurrentJobCount--;
}

export function getConcurrentCount() {
  return concurrentJobCount;
}

export function canUserExecute(userId) {
  const count = getUserExecutionCount(userId);
  if (count >= USER_LIMITS.MAX_EXECUTIONS_PER_MINUTE) {
    return {
      allowed: false,
      reason: `User ${userId} has hit the execution limit of ${USER_LIMITS.MAX_EXECUTIONS_PER_MINUTE} executions/min.`,
    };
  }
  return { allowed: true };
}

export function canSystemExecute() {
  if (getSystemExecutionCount() >= GLOBAL_LIMITS.SYSTEM_MAX_EXECUTIONS_PER_MINUTE) {
    return {
      allowed: false,
      reason: `System execution rate limit of ${GLOBAL_LIMITS.SYSTEM_MAX_EXECUTIONS_PER_MINUTE} executions/min reached. Skipping tick.`,
    };
  }

  if (concurrentJobCount >= GLOBAL_LIMITS.MAX_CONCURRENT_JOBS) {
    return {
      allowed: false,
      reason: `Max concurrent job limit of ${GLOBAL_LIMITS.MAX_CONCURRENT_JOBS} reached.`,
    };
  }

  return { allowed: true };
}

export function recordExecution(userId) {
  recordUserExecution(userId);
  recordSystemExecution();
}

export function filterJobsForTick(jobs) {
  return jobs.slice(0, GLOBAL_LIMITS.MAX_JOBS_PER_SCHEDULER_TICK);
}

export function assertCronSafe(expression) {
  const result = validateCronSafety(expression, CronExpressionParser);
  if (!result.valid) {
    throw new Error(result.reason);
  }
}

export function assertUserJobLimit(currentJobCount) {
  if (currentJobCount >= USER_LIMITS.MAX_JOBS_PER_USER) {
    throw new Error(
      `Job limit reached. You can have at most ${USER_LIMITS.MAX_JOBS_PER_USER} active jobs.`
    );
  }
}

export function resetGuardState() {
  userExecutionLog.clear();
  systemExecutionLog = [];
  concurrentJobCount = 0;
}