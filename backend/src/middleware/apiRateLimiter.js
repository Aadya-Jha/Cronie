import rateLimit from 'express-rate-limit';
import {
  JOB_CREATION_RATE_LIMIT_OPTIONS,
  LOGIN_RATE_LIMIT_OPTIONS,
  DEFAULT_RATE_LIMIT_OPTIONS,
} from '../config/rateLimitConfig.js';

export const jobCreationLimiter = rateLimit(JOB_CREATION_RATE_LIMIT_OPTIONS);

export const loginLimiter = rateLimit(LOGIN_RATE_LIMIT_OPTIONS);

export const defaultLimiter = rateLimit(DEFAULT_RATE_LIMIT_OPTIONS);

export const jobReadLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down.',
  },
});

export const jobUpdateLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many update requests. Please wait before trying again.',
  },
});

export const jobDeleteLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many delete requests. Please wait before trying again.',
  },
});

export const jobPauseResumeLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many pause/resume requests. Please slow down.',
  },
});

export function rateLimitErrorHandler(err, req, res, next) {
  if (err.statusCode === 429) {
    return res.status(429).json({
      success: false,
      error: err.message || 'Rate limit exceeded.',
      retryAfter: res.getHeader('Retry-After') ?? null,
    });
  }
  next(err);
}