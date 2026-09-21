import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (synchronized from Supabase Authentication)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Supabase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  role: text('role').default('citizen'), // 'citizen' | 'official' | 'admin'
  createdAt: timestamp('created_at').defaultNow(),
});

// Civic Issues / Reports table
export const issues = pgTable('issues', {
  id: serial('id').primaryKey(),
  trackingId: text('tracking_id').notNull().unique(),
  userId: text('user_id'), // Supabase UID of reporter (or anonymous)
  authorName: text('author_name').default('Civic Contributor'),
  authorEmail: text('author_email'),
  title: text('title').notNull(),
  description: text('description').notNull(),
  wordCount: integer('word_count').default(0),
  category: text('category').notNull(),
  severity: text('severity').notNull().default('Medium'),
  urgency: text('urgency').notNull().default('Priority'),
  department: text('department').default('Municipal Rapid Response Cell'),
  district: text('district').default('Central Ward 4'),
  address: text('address'),
  latitude: text('latitude'),
  longitude: text('longitude'),
  imageUrl: text('image_url'),
  repairedImageUrl: text('repaired_image_url'),
  status: text('status').notNull().default('open'), // 'open' | 'investigating' | 'fixed'
  priorityScore: integer('priority_score').default(50),
  upvotes: integer('upvotes').default(0),
  timeline: text('timeline'), // JSON stringified timeline steps
  verificationVotes: text('verification_votes'), // JSON stringified verification counts
  escalationStatus: text('escalation_status').default('none'),
  detectedDefects: text('detected_defects'), // JSON stringified array of defect items
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Comments & Status Updates table
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  issueId: text('issue_id').notNull(),
  userId: text('user_id'),
  authorName: text('author_name').notNull(),
  content: text('content').notNull(),
  statusChange: text('status_change'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Issue Upvotes table to prevent duplicate votes
export const issueUpvotes = pgTable('issue_upvotes', {
  id: serial('id').primaryKey(),
  issueId: text('issue_id').notNull(),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  issues: many(issues),
}));

export const issuesRelations = relations(issues, ({ many }) => ({
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  issue: one(issues, {
    fields: [comments.issueId],
    references: [issues.trackingId],
  }),
}));
