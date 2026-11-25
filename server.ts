import express from 'express';
import cors from 'cors';
import path from 'path';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';

// Middlewares
import { requestLogger } from './server/middleware/logger';
import { authMiddleware } from './server/middleware/auth';
import { errorHandler } from './server/middleware/errorHandler';

// Route Handlers
import healthRoutes from './server/routes/health';
import issuesRoutes from './server/routes/issues';
import higherUpsRoutes from './server/routes/higherUps';
import analyticsRoutes from './server/routes/analytics';
import aiRoutes from './server/routes/ai';
import locationRoutes from './server/routes/location';
import databaseRoutes from './server/routes/database';
import communicationsRoutes from './server/routes/communications';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // High-performance gzip/deflate compression for all text/JSON responses
  app.use(compression());

  // Middle-end Security & Parsing
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Role', 'X-User-Name', 'X-User-Email', 'X-Request-Id'],
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Middle-end Request Logging & Auth Context
  app.use(requestLogger);
  app.use(authMiddleware);

  // Mount API Endpoints (FIRST before Vite middleware)
  app.use('/api/health', healthRoutes);
  app.use('/api/issues', issuesRoutes);
  app.use('/api/higher-ups', higherUpsRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/location', locationRoutes);
  app.use('/api/database', databaseRoutes);
  app.use('/api/communications', communicationsRoutes);

  // Middle-end Central Error Handler for API routes
  app.use('/api', errorHandler);

  // Serve static assets from public/ folder (manifest, icons, service worker, workers)
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Vite Middleware / Static Serving
  // Bind port immediately in dev mode while Vite initializes in parallel to avoid startup probe timeouts
  if (process.env.NODE_ENV !== 'production') {
    let viteMiddleware: ReturnType<typeof createViteServer> extends Promise<infer V>
      ? V extends { middlewares: infer M }
        ? M | null
        : null
      : null = null;

    const viteReady = createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    }).then((vite) => {
      viteMiddleware = vite.middlewares;
      console.log('[CivicFix Full-Stack] Vite dev middleware ready');
      return vite;
    });

    app.use(async (req, res, next) => {
      try {
        if (!viteMiddleware) {
          await viteReady;
        }
        if (viteMiddleware) {
          return viteMiddleware(req, res, next);
        }
        next();
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1d',
      etag: true,
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CivicFix Full-Stack] Server running on http://0.0.0.0:${PORT}`);
  });
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

process.on('unhandledRejection', (reason) => {
  console.warn('[CivicFix Server] Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[CivicFix Server] Uncaught exception:', err);
});

startServer().catch((err) => {
  console.error('[CivicFix Full-Stack] Fatal startup error:', err);
  process.exit(1);
});
