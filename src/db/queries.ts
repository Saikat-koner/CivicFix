import { eq, desc, sql, and } from 'drizzle-orm';
import { db, createPool } from './index.ts';
import { users, issues, comments, issueUpvotes } from './schema.ts';
import { CivicIssue, IssueStatus, IssueCategory, IssueComment, TimelineStep } from '../../server/types.ts';

// Helper to map DB row to CivicIssue object
function formatDbIssueToCivicIssue(
  row: typeof issues.$inferSelect,
  issueComments: typeof comments.$inferSelect[] = []
): CivicIssue {
  let parsedTimeline: TimelineStep[] = [];
  try {
    if (row.timeline) {
      parsedTimeline = JSON.parse(row.timeline);
    }
  } catch {
    parsedTimeline = [];
  }

  if (parsedTimeline.length === 0) {
    parsedTimeline = [
      {
        id: `t-${row.id}-1`,
        title: 'Report Submitted',
        timestamp: row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now',
        actor: `${row.authorName || 'Citizen'} (GPS Verified)`,
        completed: true,
        isCurrent: row.status === 'open',
      },
    ];
    if (row.status === 'investigating' || row.status === 'fixed') {
      parsedTimeline.push({
        id: `t-${row.id}-2`,
        title: 'Assigned to Municipal Response Unit',
        timestamp: 'Under Review',
        actor: row.department || 'Civic Operations Div',
        completed: true,
        isCurrent: row.status === 'investigating',
      });
    }
    if (row.status === 'fixed') {
      parsedTimeline.push({
        id: `t-${row.id}-3`,
        title: 'Defect Repaired & Restored',
        timestamp: row.updatedAt ? new Date(row.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently',
        actor: 'Municipal Rapid Repair Unit',
        completed: true,
        isCurrent: true,
      });
    }
  }

  let parsedVerificationVotes = { stillThere: 0, isFixed: 0 };
  try {
    if (row.verificationVotes) {
      parsedVerificationVotes = JSON.parse(row.verificationVotes);
    }
  } catch {
    parsedVerificationVotes = { stillThere: 0, isFixed: 0 };
  }

  const formattedComments: IssueComment[] = issueComments.map((c) => ({
    id: `c-${c.id}`,
    author: c.authorName,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    timestamp: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently',
    text: c.content,
    isOfficial: c.statusChange ? true : false,
    department: row.department || undefined,
    upvotes: 2,
    hasUpvoted: false,
  }));

  const lat = row.latitude ? parseFloat(row.latitude) : 12.9716;
  const lng = row.longitude ? parseFloat(row.longitude) : 77.5946;

  return {
    id: row.trackingId,
    code: row.trackingId.startsWith('#') ? row.trackingId : `#${row.trackingId}`,
    title: row.title,
    description: row.description,
    category: row.category as IssueCategory,
    district: row.district || 'Central Civic Zone',
    address: row.address || 'Central Ward, Municipal Boundary',
    location: {
      lat: isNaN(lat) ? 12.9716 : lat,
      lng: isNaN(lng) ? 77.5946 : lng,
    },
    status: row.status as IssueStatus,
    reportedDaysAgo: 'Recently',
    reportedDate: row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
    imageUrl: row.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    repairedImageUrl: row.repairedImageUrl || undefined,
    severity: (row.severity as 'Low' | 'Medium' | 'High') || 'Medium',
    upvotes: row.upvotes || 0,
    hasUpvoted: false,
    mergedReportsCount: 1,
    reportedBy: {
      name: row.authorName || 'Civic Contributor',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    },
    timeElapsed: 'Recent',
    timeline: parsedTimeline,
    comments: formattedComments,
    verificationVotes: parsedVerificationVotes,
    escalationStatus: (row.escalationStatus as any) || 'none',
  };
}

// User Upsert
export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string,
  photoUrl?: string,
  role?: string
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
        photoUrl: photoUrl || null,
        role: role || 'citizen',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || sql`${users.displayName}`,
          photoUrl: photoUrl || sql`${users.photoUrl}`,
          role: role || sql`${users.role}`,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user profile with database.', { cause: error });
  }
}

// Fetch all issues with optional filtering
export async function getDbIssues(filters?: {
  status?: string;
  category?: string;
  district?: string;
  search?: string;
  userId?: string;
}): Promise<CivicIssue[]> {
  try {
    const dbRows = await db.select().from(issues).orderBy(desc(issues.createdAt));

    // Fetch all comments for these issues
    const allComments = await db.select().from(comments).orderBy(comments.createdAt);
    const commentsByIssueId = new Map<string, typeof comments.$inferSelect[]>();
    for (const c of allComments) {
      const list = commentsByIssueId.get(c.issueId) || [];
      list.push(c);
      commentsByIssueId.set(c.issueId, list);
    }

    // Check upvoted issues for current user if provided
    const userUpvotedSet = new Set<string>();
    if (filters?.userId) {
      const votes = await db
        .select()
        .from(issueUpvotes)
        .where(eq(issueUpvotes.userId, filters.userId));
      for (const v of votes) {
        userUpvotedSet.add(v.issueId);
      }
    }

    let results = dbRows.map((row) => {
      const issue = formatDbIssueToCivicIssue(row, commentsByIssueId.get(row.trackingId) || []);
      if (userUpvotedSet.has(row.trackingId)) {
        issue.hasUpvoted = true;
      }
      return issue;
    });

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      results = results.filter((i) => i.status.toLowerCase() === filters.status?.toLowerCase());
    }
    if (filters?.category && filters.category !== 'all') {
      results = results.filter((i) => i.category.toLowerCase() === filters.category?.toLowerCase());
    }
    if (filters?.district && filters.district !== 'all') {
      results = results.filter((i) =>
        i.district.toLowerCase().includes(filters.district!.toLowerCase())
      );
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.address.toLowerCase().includes(q) ||
          i.code.toLowerCase().includes(q)
      );
    }

    return results;
  } catch (error) {
    console.error('Error in getDbIssues:', error);
    throw new Error('Failed to retrieve issues from database.', { cause: error });
  }
}

// Fetch single issue by tracking ID
export async function getDbIssueById(trackingId: string, userId?: string): Promise<CivicIssue | null> {
  try {
    const cleanId = trackingId.startsWith('#') ? trackingId.slice(1) : trackingId;
    const dbRows = await db
      .select()
      .from(issues)
      .where(sql`${issues.trackingId} = ${trackingId} OR ${issues.trackingId} = ${cleanId} OR ${issues.trackingId} = ${'#' + cleanId}`);

    if (dbRows.length === 0) {
      return null;
    }

    const row = dbRows[0];
    const issueComments = await db
      .select()
      .from(comments)
      .where(eq(comments.issueId, row.trackingId))
      .orderBy(comments.createdAt);

    const issue = formatDbIssueToCivicIssue(row, issueComments);

    if (userId) {
      const userVote = await db
        .select()
        .from(issueUpvotes)
        .where(and(eq(issueUpvotes.issueId, row.trackingId), eq(issueUpvotes.userId, userId)));
      if (userVote.length > 0) {
        issue.hasUpvoted = true;
      }
    }

    return issue;
  } catch (error) {
    console.error('Error in getDbIssueById:', error);
    throw new Error('Failed to retrieve issue by ID from database.', { cause: error });
  }
}

// Create new civic report
export async function createDbIssue(data: {
  title: string;
  description: string;
  category: string;
  severity?: string;
  urgency?: string;
  department?: string;
  district?: string;
  address?: string;
  location?: { lat: number; lng: number };
  imageUrl?: string;
  detectedDefects?: any[];
  wordCount?: number;
  userId?: string;
  authorName?: string;
  authorEmail?: string;
}): Promise<CivicIssue> {
  try {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const trackingId = `CFX-${randNum}`;

    const initialTimeline: TimelineStep[] = [
      {
        id: `t-${Date.now()}-1`,
        title: 'Report Submitted',
        timestamp: 'Just now',
        actor: `${data.authorName || 'Citizen Contributor'} (GPS Verified)`,
        completed: true,
        isCurrent: true,
      },
    ];

    const insertedRows = await db
      .insert(issues)
      .values({
        trackingId,
        userId: data.userId || null,
        authorName: data.authorName || 'Civic Contributor',
        authorEmail: data.authorEmail || null,
        title: data.title,
        description: data.description,
        wordCount: data.wordCount || data.description.split(/\s+/).filter(Boolean).length,
        category: data.category,
        severity: data.severity || 'Medium',
        urgency: data.urgency || 'Priority',
        department: data.department || 'Municipal Rapid Response Cell',
        district: data.district || 'Ward 112 - Central Division',
        address: data.address || 'Central Municipal Zone',
        latitude: data.location?.lat ? String(data.location.lat) : '12.9716',
        longitude: data.location?.lng ? String(data.location.lng) : '77.5946',
        imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
        status: 'open',
        priorityScore: data.severity === 'High' ? 85 : data.severity === 'Medium' ? 55 : 30,
        upvotes: 1,
        timeline: JSON.stringify(initialTimeline),
        verificationVotes: JSON.stringify({ stillThere: 1, isFixed: 0 }),
        escalationStatus: 'none',
        detectedDefects: data.detectedDefects ? JSON.stringify(data.detectedDefects) : null,
      })
      .returning();

    return formatDbIssueToCivicIssue(insertedRows[0], []);
  } catch (error) {
    console.error('Error in createDbIssue:', error);
    throw new Error('Failed to create civic issue in database.', { cause: error });
  }
}

// Upvote an issue
export async function upvoteDbIssue(
  trackingId: string,
  userId: string
): Promise<{ issue: CivicIssue; hasUpvoted: boolean }> {
  try {
    const cleanId = trackingId.startsWith('#') ? trackingId.slice(1) : trackingId;
    const existing = await db
      .select()
      .from(issues)
      .where(sql`${issues.trackingId} = ${trackingId} OR ${issues.trackingId} = ${cleanId}`);

    if (existing.length === 0) {
      throw new Error(`Issue ${trackingId} not found.`);
    }

    const row = existing[0];
    const userVotes = await db
      .select()
      .from(issueUpvotes)
      .where(and(eq(issueUpvotes.issueId, row.trackingId), eq(issueUpvotes.userId, userId)));

    let hasUpvoted = false;
    let newUpvotes = row.upvotes || 0;

    if (userVotes.length > 0) {
      // Toggle off upvote
      await db
        .delete(issueUpvotes)
        .where(and(eq(issueUpvotes.issueId, row.trackingId), eq(issueUpvotes.userId, userId)));
      newUpvotes = Math.max(0, newUpvotes - 1);
      hasUpvoted = false;
    } else {
      // Insert upvote
      await db.insert(issueUpvotes).values({
        issueId: row.trackingId,
        userId,
      });
      newUpvotes = newUpvotes + 1;
      hasUpvoted = true;
    }

    await db
      .update(issues)
      .set({
        upvotes: newUpvotes,
        updatedAt: new Date(),
      })
      .where(eq(issues.id, row.id));

    const updatedIssue = await getDbIssueById(row.trackingId, userId);
    return { issue: updatedIssue!, hasUpvoted };
  } catch (error) {
    console.error('Error in upvoteDbIssue:', error);
    throw new Error('Failed to update issue upvote in database.', { cause: error });
  }
}

// Add comment to issue
export async function addDbComment(
  trackingId: string,
  commentData: {
    userId?: string;
    authorName: string;
    content: string;
    statusChange?: string;
  }
): Promise<CivicIssue> {
  try {
    const cleanId = trackingId.startsWith('#') ? trackingId.slice(1) : trackingId;
    const existing = await db
      .select()
      .from(issues)
      .where(sql`${issues.trackingId} = ${trackingId} OR ${issues.trackingId} = ${cleanId}`);

    if (existing.length === 0) {
      throw new Error(`Issue ${trackingId} not found.`);
    }

    const row = existing[0];

    // Insert comment
    await db.insert(comments).values({
      issueId: row.trackingId,
      userId: commentData.userId || null,
      authorName: commentData.authorName,
      content: commentData.content,
      statusChange: commentData.statusChange || null,
    });

    // If status changed, update issue
    if (commentData.statusChange) {
      let timelineSteps: TimelineStep[] = [];
      try {
        if (row.timeline) timelineSteps = JSON.parse(row.timeline);
      } catch {
        timelineSteps = [];
      }

      timelineSteps.forEach((s) => (s.isCurrent = false));
      timelineSteps.push({
        id: `t-${Date.now()}`,
        title: `Status: ${commentData.statusChange}`,
        timestamp: 'Just now',
        actor: commentData.authorName,
        completed: true,
        isCurrent: true,
      });

      await db
        .update(issues)
        .set({
          status: commentData.statusChange as any,
          timeline: JSON.stringify(timelineSteps),
          updatedAt: new Date(),
        })
        .where(eq(issues.id, row.id));
    }

    const updated = await getDbIssueById(row.trackingId);
    return updated!;
  } catch (error) {
    console.error('Error in addDbComment:', error);
    throw new Error('Failed to add comment to issue.', { cause: error });
  }
}

// Seed initial realistic issues if database is empty
export async function seedInitialIssuesIfEmpty() {
  try {
    const existingCount = await db.select({ count: sql<number>`count(*)` }).from(issues);
    if (Number(existingCount[0]?.count || 0) > 0) {
      return;
    }

    console.log('[Cloud SQL] Seeding initial civic issues into PostgreSQL database...');

    const sampleIssues = [
      {
        trackingId: 'CFX-8921',
        title: 'Severe Deep Pothole & Craters on 100 Feet Road',
        description: 'Deep cratered pothole (~15cm depth) on 100 Feet Road, Indiranagar near 12th Main junction. Causing severe traffic bottlenecks and two-wheeler skid hazards.',
        category: 'Roads',
        district: 'Indiranagar (Ward 112)',
        address: '100 Feet Road near 12th Main Junction, Indiranagar, Bengaluru, Karnataka 560038',
        latitude: '12.9719',
        longitude: '77.6412',
        status: 'fixed',
        imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
        repairedImageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f7?auto=format&fit=crop&w=800&q=80',
        severity: 'High',
        urgency: 'Critical',
        department: 'BBMP Road Infrastructure Cell',
        upvotes: 42,
        priorityScore: 92,
        wordCount: 26,
        timeline: JSON.stringify([
          { id: 't-1', title: 'Report Submitted', timestamp: 'Oct 12, 09:45 AM', actor: 'Aarav Patel (GPS Verified)', completed: true },
          { id: 't-2', title: 'Assigned to BBMP Road Crew', timestamp: 'Oct 13, 02:15 PM', actor: 'East Zone Road Maintenance Div #4', completed: true },
          { id: 't-3', title: 'Issue Fixed & Resurfaced', timestamp: 'Oct 17, 11:30 AM', actor: 'Hot-Mix Bitumen Resurfaced & Rolled', completed: true, isCurrent: true },
        ]),
        verificationVotes: JSON.stringify({ stillThere: 2, isFixed: 22 }),
      },
      {
        trackingId: 'CFX-9014',
        title: 'Non-Functional Streetlight Grid on 80 Feet Road',
        description: 'Four consecutive municipal LED street poles out of order for 5 days. Complete dark zone between Sony World Signal and Koramangala 4th Block.',
        category: 'Utilities',
        district: 'Koramangala (Ward 151)',
        address: '80 Feet Road, 4th Block, Koramangala, Bengaluru, Karnataka 560034',
        latitude: '12.9344',
        longitude: '77.6253',
        status: 'investigating',
        imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        severity: 'Medium',
        urgency: 'Priority',
        department: 'BESCOM & Municipal Lighting Authority',
        upvotes: 28,
        priorityScore: 68,
        wordCount: 25,
        timeline: JSON.stringify([
          { id: 't-4', title: 'Report Submitted', timestamp: 'Oct 15, 08:30 PM', actor: 'Sneha Rao (GPS Verified)', completed: true },
          { id: 't-5', title: 'Transformer Inspection Scheduled', timestamp: 'Oct 16, 10:00 AM', actor: 'BESCOM Division 7 Technician', completed: true, isCurrent: true },
        ]),
        verificationVotes: JSON.stringify({ stillThere: 14, isFixed: 1 }),
      },
      {
        trackingId: 'CFX-9102',
        title: 'High-Pressure Water Main Pipe Burst',
        description: 'Clean drinking water gushing uncontrollably across public roadway at ~300 liters per minute from underground pipeline fracture.',
        category: 'Utilities',
        district: 'Jayanagar (Ward 168)',
        address: '9th Main, 4th Block, Jayanagar, Bengaluru, Karnataka 560011',
        latitude: '12.9298',
        longitude: '77.5824',
        status: 'open',
        imageUrl: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80',
        severity: 'High',
        urgency: 'Critical',
        department: 'Bangalore Water Supply and Sewerage Board (BWSSB)',
        upvotes: 35,
        priorityScore: 88,
        wordCount: 22,
        timeline: JSON.stringify([
          { id: 't-6', title: 'Emergency Alert Logged', timestamp: 'Oct 18, 07:15 AM', actor: 'Citizen Emergency Dispatch', completed: true, isCurrent: true },
        ]),
        verificationVotes: JSON.stringify({ stillThere: 19, isFixed: 0 }),
      },
      {
        trackingId: 'CFX-9145',
        title: 'Hazardous Construction Waste & Debris Blockage',
        description: 'Illegal dumping of concrete rubble, plaster, and shattered glass on pedestrian sidewalk, completely obstructing wheelchair access.',
        category: 'Sanitation',
        district: 'HSR Layout (Ward 174)',
        address: '27th Main Road, Sector 1, HSR Layout, Bengaluru, Karnataka 560102',
        latitude: '12.9116',
        longitude: '77.6389',
        status: 'open',
        imageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
        severity: 'Medium',
        urgency: 'Priority',
        department: 'Solid Waste Management Cell',
        upvotes: 19,
        priorityScore: 60,
        wordCount: 20,
        timeline: JSON.stringify([
          { id: 't-7', title: 'Sanitation Violation Reported', timestamp: 'Oct 18, 11:20 AM', actor: 'Local Resident Association', completed: true, isCurrent: true },
        ]),
        verificationVotes: JSON.stringify({ stillThere: 9, isFixed: 0 }),
      }
    ];

    for (const item of sampleIssues) {
      await db.insert(issues).values(item);
    }

    // Seed sample comments
    await db.insert(comments).values([
      {
        issueId: 'CFX-8921',
        authorName: 'Er. Suresh Murthy (Asphalt Division)',
        content: 'BBMP Rapid Asphalt Crew sealed the crater with Grade-1 bitumen mix and leveled it flush with road grade. Traffic movement fully restored.',
        statusChange: 'fixed',
      },
      {
        issueId: 'CFX-8921',
        authorName: 'Priya Sharma',
        content: 'Drove through Indiranagar 100ft road today—smooth as silk now! Appreciate the fast turnaround by the ward team.',
      },
      {
        issueId: 'CFX-9014',
        authorName: 'BESCOM Maintenance Control',
        content: 'Feeder pillar line breaker tripped due to cable short. Repair vehicle dispatched for underground splice.',
        statusChange: 'investigating',
      },
    ]);

    console.log('[Cloud SQL] Seeding complete.');
  } catch (error) {
    console.error('Error in seedInitialIssuesIfEmpty:', error);
  }
}

// ---------------------------------------------------------------------------
// ADMIN DATABASE MODIFICATION CAPABILITIES
// ---------------------------------------------------------------------------

// Update an issue in PostgreSQL by tracking ID
export async function updateDbIssue(
  trackingId: string,
  updates: Record<string, any>
): Promise<CivicIssue> {
  const cleanId = trackingId.startsWith('#') ? trackingId.slice(1) : trackingId;
  const existing = await db
    .select()
    .from(issues)
    .where(sql`${issues.trackingId} = ${trackingId} OR ${issues.trackingId} = ${cleanId} OR ${issues.trackingId} = ${'#' + cleanId}`);

  if (existing.length === 0) {
    throw new Error(`Issue ${trackingId} not found in database.`);
  }

  const row = existing[0];
  const updatePayload: any = {
    ...updates,
    updatedAt: new Date(),
  };

  delete updatePayload.id; // protect primary key
  delete updatePayload.created_at;
  delete updatePayload.createdAt;
  delete updatePayload.updated_at; // avoid duplicate assignment with updatedAt in Drizzle ORM

  await db
    .update(issues)
    .set(updatePayload)
    .where(eq(issues.id, row.id));

  const updated = await getDbIssueById(row.trackingId);
  return updated!;
}

// Delete an issue from PostgreSQL by tracking ID, code, or numeric ID
export async function deleteDbIssue(identifier: string): Promise<boolean> {
  const cleanId = identifier.startsWith('#') ? identifier.slice(1) : identifier;
  const numId = cleanId.startsWith('issue-')
    ? parseInt(cleanId.slice(6), 10)
    : parseInt(cleanId, 10);

  // Map known sample mock IDs to tracking IDs in PostgreSQL
  const mockMap: Record<string, string> = {
    'issue-1': 'CFX-8921',
    'issue-2': 'CFX-9014',
    'issue-3': 'CFX-9052',
    'issue-4': 'CFX-9104',
    'issue-5': 'CFX-9145',
  };
  const mapped = mockMap[identifier] || mockMap[cleanId];

  // Look up issue by tracking ID, prefixed code, or numeric primary key
  const existing = await db
    .select()
    .from(issues)
    .where(
      sql`${issues.trackingId} = ${identifier}
       OR ${issues.trackingId} = ${cleanId}
       OR ${issues.trackingId} = ${'#' + cleanId}
       OR LOWER(${issues.trackingId}) = ${cleanId.toLowerCase()}
       ${mapped ? sql`OR ${issues.trackingId} = ${mapped}` : sql``}
       ${!isNaN(numId) ? sql`OR ${issues.id} = ${numId}` : sql``}`
    );

  if (existing.length === 0) {
    return false;
  }

  for (const row of existing) {
    // Delete associated votes and comments first
    await db.delete(comments).where(
      sql`${comments.issueId} = ${row.trackingId} OR ${comments.issueId} = ${String(row.id)} OR ${comments.issueId} = ${'#' + row.trackingId}`
    );
    await db.delete(issueUpvotes).where(
      sql`${issueUpvotes.issueId} = ${row.trackingId} OR ${issueUpvotes.issueId} = ${String(row.id)} OR ${issueUpvotes.issueId} = ${'#' + row.trackingId}`
    );
    await db.delete(issues).where(eq(issues.id, row.id));
  }

  return true;
}

// Fetch arbitrary table rows for Admin Database Explorer
export async function getDbTableRows(tableName: string, limit = 50, offset = 0) {
  const pool = createPool();
  const allowedTables = ['issues', 'users', 'comments', 'issue_upvotes'];
  if (!allowedTables.includes(tableName)) {
    throw new Error(`Unauthorized or invalid table: ${tableName}`);
  }

  const queryText = `SELECT * FROM "${tableName}" ORDER BY id DESC LIMIT $1 OFFSET $2;`;
  const countText = `SELECT COUNT(*) as total FROM "${tableName}";`;

  const [dataRes, countRes] = await Promise.all([
    pool.query(queryText, [limit, offset]),
    pool.query(countText),
  ]);

  return {
    rows: dataRes.rows,
    fields: dataRes.fields.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID })),
    total: Number(countRes.rows[0]?.total || 0),
    limit,
    offset,
  };
}

// Update single table row by ID for Admin Live Editor
export async function updateDbTableRow(tableName: string, id: number | string, data: Record<string, any>) {
  const pool = createPool();
  const allowedTables = ['issues', 'users', 'comments', 'issue_upvotes'];
  if (!allowedTables.includes(tableName)) {
    throw new Error(`Unauthorized or invalid table: ${tableName}`);
  }

  // Filter out primary key and auto-managed timestamp columns to avoid multiple assignments
  const protectedCols = new Set(['id', 'created_at', 'createdAt', 'updated_at', 'updatedAt']);
  const keys = Object.keys(data).filter((k) => !protectedCols.has(k));

  if (keys.length === 0 && tableName !== 'issues') {
    throw new Error('No valid fields to update.');
  }

  const setClauses: string[] = keys.map((key, idx) => `"${key}" = $${idx + 1}`);
  const values: any[] = keys.map((k) => data[k]);
  values.push(id);

  if (tableName === 'issues') {
    setClauses.push('"updated_at" = NOW()');
  }

  if (setClauses.length === 0) {
    throw new Error('No valid fields to update.');
  }

  const queryText = `UPDATE "${tableName}" SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *;`;

  const res = await pool.query(queryText, values);
  return res.rows[0];
}

// Insert single table row for Admin Editor
export async function insertDbTableRow(tableName: string, data: Record<string, any>) {
  const pool = createPool();
  const allowedTables = ['issues', 'users', 'comments', 'issue_upvotes'];
  if (!allowedTables.includes(tableName)) {
    throw new Error(`Unauthorized or invalid table: ${tableName}`);
  }

  const protectedCols = new Set(['id']);
  const keys = Object.keys(data).filter((k) => !protectedCols.has(k) && data[k] !== undefined);
  if (keys.length === 0) {
    throw new Error('No fields provided for insertion.');
  }

  const colNames = keys.map((k) => `"${k}"`).join(', ');
  const valPlaceholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
  const values = keys.map((k) => data[k]);

  const queryText = `INSERT INTO "${tableName}" (${colNames}) VALUES (${valPlaceholders}) RETURNING *;`;
  const res = await pool.query(queryText, values);
  return res.rows[0];
}

// Delete single table row for Admin Editor
export async function deleteDbTableRow(tableName: string, id: number | string) {
  const pool = createPool();
  const allowedTables = ['issues', 'users', 'comments', 'issue_upvotes'];
  if (!allowedTables.includes(tableName)) {
    throw new Error(`Unauthorized or invalid table: ${tableName}`);
  }

  if (tableName === 'issues') {
    // Delete dependent comments and upvotes first to prevent foreign key errors
    await pool.query(
      `DELETE FROM comments WHERE issue_id = $1::text OR issue_id = (SELECT tracking_id FROM issues WHERE id::text = $1::text OR tracking_id = $1::text);`,
      [id]
    ).catch(() => {});
    await pool.query(
      `DELETE FROM issue_upvotes WHERE issue_id = $1::text OR issue_id = (SELECT tracking_id FROM issues WHERE id::text = $1::text OR tracking_id = $1::text);`,
      [id]
    ).catch(() => {});

    const res = await pool.query(
      `DELETE FROM "issues" WHERE id::text = $1::text OR tracking_id = $1::text RETURNING *;`,
      [id]
    );
    return (res.rowCount ?? 0) > 0;
  }

  const res = await pool.query(`DELETE FROM "${tableName}" WHERE id::text = $1::text RETURNING *;`, [id]);
  return (res.rowCount ?? 0) > 0;
}

// Sanitizes and intelligently transforms incoming SQL queries for the Admin Console
export function sanitizeAndTransformAdminSql(rawSql: string): { sql: string; info?: string } {
  let query = rawSql.trim();
  if (!query) {
    throw new Error('SQL query cannot be empty.');
  }

  const lower = query.toLowerCase();

  // Support helpful slash commands and path shortcuts
  if (lower === '/' || lower === '/help' || lower === '/?' || lower === 'help') {
    return {
      sql: `SELECT 'Available tables in database' AS section, 'issues, comments, users, issue_upvotes' AS tables;`,
      info: 'SQL Console Help: Enter standard SQL statements (SELECT, INSERT, UPDATE, DELETE). Single-line comments use "--" instead of "//". Quick commands: /tables, /schema, /issues, /comments, /users.',
    };
  }

  if (lower === '/tables' || lower === '/dt' || lower === '\\dt') {
    return {
      sql: `SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`,
      info: 'Listing all public tables in Cloud SQL PostgreSQL.',
    };
  }

  if (lower === '/schema' || lower === '/d' || lower === '\\d') {
    return {
      sql: `SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position;`,
      info: 'Displaying table schema columns and data types.',
    };
  }

  if (lower === '/issues' || lower === '/api/issues' || lower === '/api/database/tables/issues' || lower === 'issues') {
    return {
      sql: `SELECT id, tracking_id, title, category, severity, status, upvotes, created_at FROM issues ORDER BY id DESC LIMIT 25;`,
      info: 'Displaying recent civic issues from Cloud SQL PostgreSQL.',
    };
  }

  if (lower === '/comments' || lower === '/api/database/tables/comments' || lower === 'comments') {
    return {
      sql: `SELECT id, issue_id, author_name, role, text, created_at FROM comments ORDER BY id DESC LIMIT 25;`,
      info: 'Displaying recent issue comments from Cloud SQL PostgreSQL.',
    };
  }

  if (lower === '/users' || lower === '/api/database/tables/users' || lower === 'users') {
    return {
      sql: `SELECT id, uid, email, display_name, role, created_at FROM users ORDER BY created_at DESC LIMIT 25;`,
      info: 'Displaying registered users from Cloud SQL PostgreSQL.',
    };
  }

  if (lower === '/upvotes' || lower === '/api/database/tables/issue_upvotes' || lower === 'issue_upvotes') {
    return {
      sql: `SELECT id, issue_id, user_id, user_name, created_at FROM issue_upvotes ORDER BY id DESC LIMIT 25;`,
      info: 'Displaying verification upvotes from Cloud SQL PostgreSQL.',
    };
  }

  // Convert JS-style `//` comments into SQL `--` comments
  const lines = query.split('\n');
  const transformedLines = lines.map((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('//')) {
      return line.replace('//', '--');
    }
    // Remove standalone slash execution delimiter lines (e.g. Oracle/SQL*Plus style)
    if (trimmedLine === '/') {
      return '';
    }
    // Trailing // comment on a SQL line
    return line.replace(/(\s)\/\/(\s.*)?$/, '$1--$2');
  });

  query = transformedLines.filter((l) => l.trim() !== '').join('\n').trim();

  // Strip trailing slashes like `; /` or `;\n/` or trailing `/`
  query = query.replace(/;\s*\/+$/, ';');
  query = query.replace(/\s*\/+$/, '');

  // If after cleaning it still begins with an invalid leading slash command
  if (query.startsWith('/')) {
    throw new Error(
      `Invalid SQL command "${query}". In SQL, comments use "--" (e.g. "-- my query"). Quick commands available: /tables, /schema, /issues, /comments, /users.`
    );
  }

  return { sql: query };
}

// Run Admin raw SQL
export async function executeAdminRawSql(sqlQuery: string) {
  const pool = createPool();
  const { sql: sanitizedSql, info } = sanitizeAndTransformAdminSql(sqlQuery);

  if (sanitizedSql.toLowerCase().includes('drop database') || sanitizedSql.toLowerCase().includes('drop user')) {
    throw new Error('Destructive database-level drop operations are restricted.');
  }

  const startTime = Date.now();
  const result = await pool.query(sanitizedSql);
  const durationMs = Date.now() - startTime;

  return {
    command: result.command,
    rowCount: result.rowCount,
    rows: result.rows || [],
    fields: result.fields ? result.fields.map((f) => f.name) : [],
    durationMs,
    info,
  };
}

// Reseed Default Issues & Comments
export async function reseedDbIssues() {
  const pool = createPool();
  await pool.query('DELETE FROM "comments";');
  await pool.query('DELETE FROM "issue_upvotes";');
  await pool.query('DELETE FROM "issues";');

  await seedInitialIssuesIfEmpty();
  return true;
}
