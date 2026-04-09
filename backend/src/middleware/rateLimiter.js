const rateLimitMap = new Map();

const DEFAULT_WINDOW_MS = 60000;
const DEFAULT_MAX_REQUESTS = 10;

const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value.timestamp > DEFAULT_WINDOW_MS) {
      rateLimitMap.delete(key);
    }
  }
};

setInterval(cleanupExpiredEntries, DEFAULT_WINDOW_MS * 2);

export const createRateLimiter = (
  maxRequests = DEFAULT_MAX_REQUESTS,
  windowMs = DEFAULT_WINDOW_MS
) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection?.remoteAddress || "unknown";
    const now = Date.now();

    let clientData = rateLimitMap.get(clientIP);

    if (!clientData || now - clientData.timestamp > windowMs) {
      clientData = { count: 1, timestamp: now };
      rateLimitMap.set(clientIP, clientData);
      return next();
    }

    clientData.count += 1;

    if (clientData.count > maxRequests) {
      const retryAfter = Math.ceil(
        (clientData.timestamp + windowMs - now) / 1000
      );
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        success: false,
        error: "Too many requests. Please try again later.",
        retryAfter,
      });
    }

    next();
  };
};

export const aiRateLimiter = createRateLimiter(10, 60000);

export const getRateLimitStatus = (clientIP) => {
  const clientData = rateLimitMap.get(clientIP);
  if (!clientData) {
    return { requestsUsed: 0, requestsRemaining: 10, resetTime: null };
  }

  const now = Date.now();
  const resetTime = clientData.timestamp + DEFAULT_WINDOW_MS;

  return {
    requestsUsed: clientData.count,
    requestsRemaining: Math.max(0, DEFAULT_MAX_REQUESTS - clientData.count),
    resetTime: new Date(resetTime).toISOString(),
  };
};

export default {
  createRateLimiter,
  aiRateLimiter,
  getRateLimitStatus,
};
