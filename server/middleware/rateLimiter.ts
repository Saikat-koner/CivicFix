import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipBuckets = new Map<string, RateLimitRecord>();

export function createRateLimiter(options: { maxRequests: number; windowMs: number; message?: string }) {
  const { maxRequests, windowMs, message = 'Too many requests. Please try again shortly.' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : (req.ip || '127.0.0.1');
    const now = Date.now();

    const record = ipBuckets.get(clientIp);

    if (!record || now > record.resetTime) {
      ipBuckets.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        error: message,
        retryAfter: retryAfterSeconds,
        timestamp: new Date().toISOString(),
      });
    }

    record.count += 1;
    next();
  };
}

// Clean up stale buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipBuckets.entries()) {
    if (now > record.resetTime) {
      ipBuckets.delete(ip);
    }
  }
}, 5 * 60 * 1000);
