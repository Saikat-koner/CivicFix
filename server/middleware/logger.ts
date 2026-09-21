import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Only log API and health requests, bypass internal Vite HMR/module transforms
  if (!req.originalUrl.startsWith('/api') && !req.originalUrl.startsWith('/health')) {
    return next();
  }

  const start = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  // Attach requestId to response headers
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const statusColor = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    const resetColor = '\x1b[0m';

    console.log(
      `[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.originalUrl} -> ${statusColor}${statusCode}${resetColor} (${duration}ms)`
    );
  });

  next();
}
