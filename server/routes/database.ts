import { Router, Request, Response } from 'express';
import { db } from '../../src/db/index';
import { sql } from 'drizzle-orm';
import { issues, users, comments, issueUpvotes } from '../../src/db/schema';
import {
  getDbTableRows,
  updateDbTableRow,
  insertDbTableRow,
  deleteDbTableRow,
  executeAdminRawSql,
  reseedDbIssues,
  getOrCreateUser,
} from '../../src/db/queries';

const router = Router();

// GET /api/database - Diagnostic info and row counts from PostgreSQL Cloud SQL
const dbDiagnosticsHandler = async (req: Request, res: Response) => {
  try {
    // Run live counts
    const [userCountRes] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [issueCountRes] = await db.select({ count: sql<number>`count(*)` }).from(issues);
    const [commentCountRes] = await db.select({ count: sql<number>`count(*)` }).from(comments);
    const [upvoteCountRes] = await db.select({ count: sql<number>`count(*)` }).from(issueUpvotes);

    // Fetch up to 5 recent issues directly from PostgreSQL
    const recentDbIssues = await db
      .select({
        id: issues.id,
        trackingId: issues.trackingId,
        title: issues.title,
        category: issues.category,
        severity: issues.severity,
        status: issues.status,
        upvotes: issues.upvotes,
        createdAt: issues.createdAt,
      })
      .from(issues)
      .limit(5);

    res.json({
      success: true,
      database: {
        engine: 'PostgreSQL 16 (Google Cloud SQL)',
        region: 'asia-southeast1',
        databaseName: process.env.SQL_DB_NAME || 'applet_db',
        host: process.env.SQL_HOST ? 'Connected (Cloud SQL Auth)' : 'localhost',
        connectionStatus: 'ACTIVE_CONNECTED',
        tables: {
          issues: {
            name: 'issues',
            rowCount: Number(issueCountRes?.count ?? 0),
            primaryKey: 'id',
            description: 'Civic defect reports, GPS coords, status, upvotes, and verification logs',
          },
          users: {
            name: 'users',
            rowCount: Number(userCountRes?.count ?? 0),
            primaryKey: 'id',
            description: 'Authenticated citizens and municipal officers synced from Supabase Auth',
          },
          comments: {
            name: 'comments',
            rowCount: Number(commentCountRes?.count ?? 0),
            primaryKey: 'id',
            description: 'Community and administrative comment threads per issue',
          },
          issue_upvotes: {
            name: 'issue_upvotes',
            rowCount: Number(upvoteCountRes?.count ?? 0),
            primaryKey: 'id',
            description: 'Unique voter index preventing duplicate upvotes',
          },
        },
        sampleData: recentDbIssues,
      },
      endpoints: {
        health: '/api/health',
        issues: '/api/issues',
        databaseStats: '/api/database',
        analytics: '/api/analytics/overview',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching database diagnostic info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to query database diagnostics',
      message: error?.message || 'Database query error',
    });
  }
};

router.get('/', dbDiagnosticsHandler);
router.get('/diagnostics', dbDiagnosticsHandler);

// GET /api/database/tables/:table - Browse rows for Admin Explorer
router.get('/tables/:table', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

    const result = await getDbTableRows(req.params.table, limit, offset);
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`Error reading table ${req.params.table}:`, error);
    res.status(400).json({
      success: false,
      error: error?.message || 'Failed to read table rows',
    });
  }
});

// POST /api/database/tables/:table - Insert new row into PostgreSQL table
router.post('/tables/:table', async (req: Request, res: Response) => {
  try {
    const inserted = await insertDbTableRow(req.params.table, req.body);
    res.status(201).json({
      success: true,
      data: inserted,
      message: `Record inserted successfully into ${req.params.table}.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`Error inserting into ${req.params.table}:`, error);
    res.status(400).json({
      success: false,
      error: error?.message || 'Failed to insert record',
    });
  }
});

// PUT /api/database/tables/:table/:id - Update existing row in PostgreSQL table
router.put('/tables/:table/:id', async (req: Request, res: Response) => {
  try {
    const updated = await updateDbTableRow(req.params.table, req.params.id, req.body);
    res.json({
      success: true,
      data: updated,
      message: `Record #${req.params.id} updated successfully in ${req.params.table}.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`Error updating record #${req.params.id} in ${req.params.table}:`, error);
    res.status(400).json({
      success: false,
      error: error?.message || 'Failed to update record',
    });
  }
});

// DELETE /api/database/tables/:table/:id - Delete row in PostgreSQL table
router.delete('/tables/:table/:id', async (req: Request, res: Response) => {
  try {
    const success = await deleteDbTableRow(req.params.table, req.params.id);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: `Record #${req.params.id} not found or already deleted from ${req.params.table}.`,
      });
    }
    res.json({
      success: true,
      message: `Record #${req.params.id} deleted successfully from ${req.params.table}.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`Error deleting record #${req.params.id} from ${req.params.table}:`, error);
    res.status(400).json({
      success: false,
      error: error?.message || 'Failed to delete record',
    });
  }
});

// POST /api/database/execute - Execute custom Admin SQL Query on Cloud SQL PostgreSQL
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required string field "query".',
      });
    }

    const result = await executeAdminRawSql(query);
    res.json({
      success: true,
      data: result,
      message: result.info || `SQL executed successfully in ${result.durationMs}ms. Command: ${result.command}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const errorMsg = error?.message || 'Database SQL execution error';
    console.warn('[Database Router] Query execution note:', errorMsg);

    let hint = error?.hint;
    if (errorMsg.includes('syntax error') && errorMsg.includes('/')) {
      hint = 'Single-line comments in SQL require "--" (e.g. "-- comment"), not "//". Quick commands: /tables, /schema, /issues.';
    }

    res.json({
      success: false,
      error: errorMsg,
      hint,
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/database/register-user - Permanently record newly registered user in PostgreSQL
router.post('/register-user', async (req: Request, res: Response) => {
  try {
    const { uid, email, displayName, photoUrl, role } = req.body;
    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        error: 'Fields "uid" and "email" are required to register a user.',
      });
    }

    const savedUser = await getOrCreateUser(uid, email, displayName, photoUrl, role);
    res.json({
      success: true,
      user: savedUser,
      message: `User permanent ID '${uid}' registered and stored permanently in Cloud SQL PostgreSQL.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error registering user in database:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to register user in PostgreSQL database.',
    });
  }
});

// POST /api/database/reset - Reseed / Reset Database with Standard Records
router.post('/reset', async (req: Request, res: Response) => {
  try {
    await reseedDbIssues();
    res.json({
      success: true,
      message: 'PostgreSQL database successfully re-seeded with initial verified civic issues.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error reseeding database:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to reseed database',
    });
  }
});

export default router;

