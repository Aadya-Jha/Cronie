import { GLOBAL_LIMITS } from '../config/rateLimitConfig.js';

let concurrentCount = 0;
let systemExecutionLog = [];
let tickJobCount = 0;

function pruneSystemLog() {
  const windowStart = Date.now() - 60_000;
  systemExecutionLog = systemExecutionLog.filter(t => t > windowStart);
}

export function getSystemExecutionCount() {
  pruneSystemLog();
  return systemExecutionLog.length;
}

export function getConcurrentCount() {
  return concurrentCount;
}

export function getTickJobCount() {
  return tickJobCount;
}

export function incrementConcurrent() {
  concurrentCount++;
}

export function decrementConcurrent() {
  if (concurrentCount > 0) concurrentCount--;
}

export function recordSystemExecution() {
  systemExecutionLog.push(Date.now());
}

export function resetTickCount() {
  tickJobCount = 0;
}

export function incrementTickCount() {
  tickJobCount++;
}

export function isSystemThroughputExceeded() {
  return getSystemExecutionCount() >= GLOBAL_LIMITS.SYSTEM_MAX_EXECUTIONS_PER_MINUTE;
}

export function isConcurrencyLimitReached() {
  return concurrentCount >= GLOBAL_LIMITS.MAX_CONCURRENT_JOBS;
}

export function isTickCapReached() {
  return tickJobCount >= GLOBAL_LIMITS.MAX_JOBS_PER_SCHEDULER_TICK;
}

export function canDispatch() {
  if (isSystemThroughputExceeded()) {
    return {
      allowed: false,
      reason: `System throughput limit of ${GLOBAL_LIMITS.SYSTEM_MAX_EXECUTIONS_PER_MINUTE} executions/min exceeded.`,
      code: 'SYSTEM_THROUGHPUT_EXCEEDED',
    };
  }

  if (isConcurrencyLimitReached()) {
    return {
      allowed: false,
      reason: `Max concurrent job limit of ${GLOBAL_LIMITS.MAX_CONCURRENT_JOBS} reached.`,
      code: 'CONCURRENCY_LIMIT_REACHED',
    };
  }

  if (isTickCapReached()) {
    return {
      allowed: false,
      reason: `Scheduler tick cap of ${GLOBAL_LIMITS.MAX_JOBS_PER_SCHEDULER_TICK} jobs reached for this tick.`,
      code: 'TICK_CAP_REACHED',
    };
  }

  return { allowed: true };
}

export function acquireSlot() {
  const check = canDispatch();
  if (!check.allowed) {
    const error = new Error(check.reason);
    error.code = check.code;
    error.statusCode = 429;
    throw error;
  }
  incrementConcurrent();
  incrementTickCount();
  recordSystemExecution();
}

export function releaseSlot() {
  decrementConcurrent();
}

export function getSystemUsage() {
  return {
    concurrent: {
      used: concurrentCount,
      limit: GLOBAL_LIMITS.MAX_CONCURRENT_JOBS,
      remaining: Math.max(0, GLOBAL_LIMITS.MAX_CONCURRENT_JOBS - concurrentCount),
    },
    throughput: {
      used: getSystemExecutionCount(),
      limit: GLOBAL_LIMITS.SYSTEM_MAX_EXECUTIONS_PER_MINUTE,
      remaining: Math.max(0, GLOBAL_LIMITS.SYSTEM_MAX_EXECUTIONS_PER_MINUTE - getSystemExecutionCount()),
      windowMs: 60_000,
    },
    tick: {
      used: tickJobCount,
      limit: GLOBAL_LIMITS.MAX_JOBS_PER_SCHEDULER_TICK,
      remaining: Math.max(0, GLOBAL_LIMITS.MAX_JOBS_PER_SCHEDULER_TICK - tickJobCount),
    },
  };
}

export function resetGlobalLimiterState() {
  concurrentCount = 0;
  systemExecutionLog = [];
  tickJobCount = 0;
}