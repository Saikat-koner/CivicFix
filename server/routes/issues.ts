import { Router, Request, Response, NextFunction } from 'express';
import {
  getDbIssues,
  getDbIssueById,
  createDbIssue,
  upvoteDbIssue,
  addDbComment,
  updateDbIssue,
  deleteDbIssue,
} from '../../src/db/queries.ts';
import { dataStore } from '../services/store';
import {
  validateCreateIssue,
  validateVote,
  validateComment,
} from '../middleware/validation';
import { AuthenticatedRequest } from '../middleware/auth';
import { analyzeCivicIncident } from '../services/gemini';
import { apiCache } from '../services/cache';
import { realtimeStreamManager } from '../services/sse';
import { CIVIC_CATEGORIES_CATALOG } from '../../src/types';

const router = Router();

// GET /api/issues/categories - Complete catalog of 22+ civic issue categories with SLAs & departments
router.get('/categories', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    total: CIVIC_CATEGORIES_CATALOG.length,
    data: CIVIC_CATEGORIES_CATALOG,
  });
});

// GET /api/issues/stream - Real-time Server-Sent Events (SSE) Stream for StreamBuilder Reactive updates
router.get('/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  realtimeStreamManager.registerClient(res, req.query.clientId as string);
});

// GET /api/issues - List & filter issues from Cloud SQL PostgreSQL (Cached for high concurrency)
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, category, district, search } = req.query;
    const cacheKey = `issues:list:${JSON.stringify(req.query)}:${req.user?.id || 'anon'}`;

    // Fast-path: return cached response if present
    const cachedResponse = apiCache.get(cacheKey);
    if (cachedResponse) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }

    const issues = await getDbIssues({
      status: status as string,
      category: category as string,
      district: district as string,
      search: search as string,
      userId: req.user?.id,
    });

    const responsePayload = {
      success: true,
      data: issues,
      meta: {
        total: issues.length,
        filter: { status, category, district, search },
        source: 'Cloud SQL PostgreSQL',
      },
      timestamp: new Date().toISOString(),
    };

    // Cache for 3.5 seconds to absorb spikes while maintaining near real-time sync
    apiCache.set(cacheKey, responsePayload, 3500);
    res.setHeader('X-Cache', 'MISS');
    res.json(responsePayload);
  } catch (err) {
    // Fallback to in-memory store if DB query encounters transient issue
    console.error('PostgreSQL query fallback to store:', err);
    try {
      const { status, category, district, search } = req.query;
      const issues = dataStore.getAllIssues({
        status: status as string,
        category: category as string,
        district: district as string,
        search: search as string,
      });
      res.json({
        success: true,
        data: issues,
        meta: {
          total: issues.length,
          filter: { status, category, district, search },
          source: 'Memory Cache',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (fallbackErr) {
      next(fallbackErr);
    }
  }
});

// GET /api/issues/:id - Single issue details from PostgreSQL
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const issue = await getDbIssueById(req.params.id, req.user?.id);

    if (!issue) {
      const fallback = dataStore.getIssueById(req.params.id);
      if (!fallback) {
        return res.status(404).json({
          success: false,
          error: `Issue '${req.params.id}' not found.`,
          timestamp: new Date().toISOString(),
        });
      }
      return res.json({
        success: true,
        data: fallback,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: issue,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/issues - Create a new civic report stored in PostgreSQL
router.post(
  '/',
  validateCreateIssue,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const {
        title,
        description,
        category,
        district,
        address,
        location,
        imageUrl,
        severity,
        urgency,
        department,
        detectedDefects,
        wordCount,
      } = req.body;

      // Optional AI enrichment if description is provided
      let enrichedTitle = title;
      let enrichedSeverity = severity || 'Medium';

      if (description && (!severity || title.length < 10)) {
        try {
          const aiResult = await analyzeCivicIncident(description);
          if (!severity) enrichedSeverity = aiResult.severity;
          if (title.length < 10 && aiResult.title) enrichedTitle = aiResult.title;
        } catch {
          // ignore error and proceed
        }
      }

      // Persist to PostgreSQL database
      const newIssue = await createDbIssue({
        title: enrichedTitle,
        description,
        category,
        district,
        address,
        location,
        imageUrl,
        severity: enrichedSeverity,
        urgency,
        department,
        detectedDefects,
        wordCount,
        userId: req.user?.id,
        authorName: req.user?.name || 'Citizen Contributor',
        authorEmail: req.user?.email,
      });

      // Keep in-memory store in sync as well
      try {
        dataStore.createIssue({
          title: enrichedTitle,
          description,
          category,
          district,
          address,
          location,
          imageUrl,
          severity: enrichedSeverity,
          reporterName: req.user?.name || 'Citizen Contributor',
        });
      } catch {
        // ignore
      }

      apiCache.invalidatePrefix('issues:');

      realtimeStreamManager.broadcast({
        type: 'issue_created',
        issueId: newIssue.id,
        data: newIssue,
        timestamp: new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        data: newIssue,
        message: 'Civic report permanently recorded in Cloud SQL PostgreSQL database.',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/issues/:id/status - Update issue resolution status in PostgreSQL
router.patch('/:id/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, officialRemark } = req.body;

    if (!['open', 'investigating', 'fixed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status: Must be "open", "investigating", or "fixed".',
        timestamp: new Date().toISOString(),
      });
    }

    const updated = await addDbComment(req.params.id, {
      userId: req.user?.id,
      authorName: req.user?.name || 'BBMP Field Officer',
      content: officialRemark || `Issue status changed to ${status}.`,
      statusChange: status,
    });

    apiCache.invalidatePrefix('issues:');

    realtimeStreamManager.broadcast({
      type: 'issue_status_changed',
      issueId: req.params.id,
      data: updated,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: updated,
      message: `Status updated to '${status}' in PostgreSQL.`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/issues/:id - Admin modification of issue details in PostgreSQL
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await updateDbIssue(req.params.id, req.body);
    // Also sync in-memory store if present
    try {
      dataStore.updateIssue(req.params.id, req.body);
    } catch {
      // ignore
    }

    apiCache.invalidatePrefix('issues:');

    realtimeStreamManager.broadcast({
      type: 'issue_updated',
      issueId: req.params.id,
      data: updated,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: updated,
      message: `Issue '${req.params.id}' updated in Cloud SQL PostgreSQL.`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error(`Error updating issue ${req.params.id}:`, err);
    res.status(400).json({
      success: false,
      error: err?.message || 'Failed to update issue in database.',
    });
  }
});

// DELETE /api/issues/:id - Admin deletion of issue from PostgreSQL
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const rawId = decodeURIComponent(req.params.id);
    const dbDeleted = await deleteDbIssue(rawId);
    let storeDeleted = false;
    try {
      storeDeleted = dataStore.deleteIssue(rawId);
    } catch {
      // ignore
    }

    apiCache.invalidatePrefix('issues:');

    realtimeStreamManager.broadcast({
      type: 'issue_deleted',
      issueId: rawId,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      deleted: dbDeleted || storeDeleted,
      message: `Issue '${rawId}' deleted successfully from database.`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error(`Error deleting issue ${req.params.id}:`, err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to delete issue from database.',
    });
  }
});


// POST /api/issues/:id/vote - Citizen verification vote
router.post(
  '/:id/vote',
  validateVote,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { voteType } = req.body;
      const updated = dataStore.recordVote(req.params.id, voteType);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: `Issue '${req.params.id}' not found.`,
          timestamp: new Date().toISOString(),
        });
      }

      apiCache.invalidatePrefix('issues:');

      realtimeStreamManager.broadcast({
        type: 'vote_recorded',
        issueId: req.params.id,
        data: updated,
        timestamp: new Date().toISOString(),
      });

      res.json({
        success: true,
        data: updated,
        message: `Citizen verification recorded: ${voteType === 'isFixed' ? 'Verified Fixed (+25 CC)' : 'Reported Still Present (+15 CC)'}.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/issues/:id/upvote - Upvote issue priority in Cloud SQL PostgreSQL
router.post('/:id/upvote', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || 'citizen-anonymous';
    const result = await upvoteDbIssue(req.params.id, userId);

    apiCache.invalidatePrefix('issues:');

    realtimeStreamManager.broadcast({
      type: 'issue_upvoted',
      issueId: req.params.id,
      data: result.issue,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: result.issue,
      message: result.hasUpvoted ? 'Issue upvoted (+1)' : 'Upvote removed',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/issues/:id/comments - Add comment or official dispatch remark
router.post(
  '/:id/comments',
  validateComment,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { text, author, statusChange } = req.body;

      const commenterName = author || req.user?.name || 'Citizen Contributor';

      const updated = await addDbComment(req.params.id, {
        userId: req.user?.id,
        authorName: commenterName,
        content: text,
        statusChange,
      });

      apiCache.invalidatePrefix('issues:');

      realtimeStreamManager.broadcast({
        type: 'comment_added',
        issueId: req.params.id,
        data: updated,
        timestamp: new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        data: updated,
        message: 'Comment posted successfully to PostgreSQL.',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
