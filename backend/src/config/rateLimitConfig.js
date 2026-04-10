export const USER_LIMITS = {
  MAX_JOBS_PER_USER: 20,
  MAX_EXECUTIONS_PER_MINUTE: 10,
  EXECUTION_WINDOW_MS: 60_000, // 1 minute
};

export const GLOBAL_LIMITS = {
  MAX_CONCURRENT_JOBS: 50,
  MAX_JOBS_PER_SCHEDULER_TICK: 30,
  SYSTEM_MAX_EXECUTIONS_PER_MINUTE: 200,
};

export const JOB_CREATION_RATE_LIMIT_OPTIONS = {
  windowMs: 15 * 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many job creation requests. Please wait before trying again.',
  },
  skipSuccessfulRequests: false,
};

export const LOGIN_RATE_LIMIT_OPTIONS = {
  windowMs: 15 * 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Your IP has been temporarily blocked.',
  },
  skipSuccessfulRequests: true, 
};

export const DEFAULT_RATE_LIMIT_OPTIONS = {
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Slow down and try again shortly.',
  },
};

export const BLOCKED_CRON_EXPRESSIONS = new Set([
  '* * * * *',
  '*/1 * * * *',
  '@reboot',
]);

export const MIN_CRON_INTERVAL_SECONDS = 300;

export const MIN_CRON_INTERVAL_DESCRIPTION = 'every 5 minutes';

/**
 * @param {string}  expression
 * @param {object}  parser
 */
export function validateCronSafety(expression, parser) {
  const trimmed = expression.trim();

  if (BLOCKED_CRON_EXPRESSIONS.has(trimmed)) {
    return {
      valid: false,
      reason: `The schedule "${trimmed}" is not allowed. Schedules that run every minute are too frequent.`,
    };
  }

  try {
    const interval = parser.parse(trimmed);
    const first  = interval.next().toDate();
    const second = interval.next().toDate();
    const gapSeconds = (second.getTime() - first.getTime()) / 1000;

    if (gapSeconds < MIN_CRON_INTERVAL_SECONDS) {
      return {
        valid: false,
        reason:
          `Schedule fires every ~${Math.round(gapSeconds)}s, which is too frequent. ` +
          `Minimum allowed interval is ${MIN_CRON_INTERVAL_DESCRIPTION}.`,
      };
    }
  } catch {
    return {
      valid: false,
      reason: `"${trimmed}" is not a valid cron expression.`,
    };
  }

  return { valid: true };
}

export default {
  USER_LIMITS,
  GLOBAL_LIMITS,
  JOB_CREATION_RATE_LIMIT_OPTIONS,
  LOGIN_RATE_LIMIT_OPTIONS,
  DEFAULT_RATE_LIMIT_OPTIONS,
  BLOCKED_CRON_EXPRESSIONS,
  MIN_CRON_INTERVAL_SECONDS,
  MIN_CRON_INTERVAL_DESCRIPTION,
  validateCronSafety,
};