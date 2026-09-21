import { Router, Request, Response, NextFunction } from 'express';
import { dataStore } from '../services/store';

const router = Router();

// GET /api/analytics - City metrics, ward SLAs, and resolution stats
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = dataStore.getAnalytics();
    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/leaderboard - Top civic contributors
router.get('/leaderboard', (req: Request, res: Response, next: NextFunction) => {
  try {
    const contributors = dataStore.getContributors();
    res.json({
      success: true,
      data: contributors,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
