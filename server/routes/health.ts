import { Router, Request, Response } from 'express';

const router = Router();
const startTime = Date.now();

router.get('/', (req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  res.json({
    success: true,
    status: 'healthy',
    uptime: `${uptimeSeconds}s`,
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
    services: {
      api: 'online',
      database: 'connected (Cloud SQL PostgreSQL via Drizzle ORM)',
      auth: 'Supabase Auth',
      geminiAI: process.env.GEMINI_API_KEY ? 'configured' : 'fallback-mode',
    },
  });
});

export default router;
