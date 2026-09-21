import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';
import { supabaseAdmin } from '../lib/supabase.ts';
import { getOrCreateUser } from '../../src/db/queries.ts';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    role: UserRole;
    email?: string;
    district?: string;
    photoUrl?: string;
  };
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const roleHeader = req.headers['x-user-role'] as string;
  const userNameHeader = req.headers['x-user-name'] as string;
  const userEmailHeader = req.headers['x-user-email'] as string;

  // Default guest citizen session
  req.user = {
    id: 'citizen-current',
    name: userNameHeader ? decodeURIComponent(userNameHeader) : 'Citizen Contributor',
    role: roleHeader === 'admin' ? 'admin' : 'citizen',
    email: userEmailHeader ? decodeURIComponent(userEmailHeader) : 'citizen@civicfix.gov.in',
    district: 'Bengaluru Central (Ward 112)',
  };

  // If Supabase Access Token / JWT is present in Authorization header
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // Development/admin override tokens
    if (token === 'admin-secret-token' || token === 'admin') {
      req.user.role = 'admin';
      req.user.name = 'BBMP Municipal Field Officer';
      return next();
    }

    try {
      // Verify with Supabase Auth
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        const supaUser = data.user;
        const meta = supaUser.user_metadata || {};
        req.user.id = supaUser.id;
        req.user.email = supaUser.email || req.user.email;
        req.user.name = meta.full_name || meta.name || (supaUser.email ? supaUser.email.split('@')[0] : 'Citizen Contributor');
        req.user.photoUrl = meta.avatar_url || meta.picture;
        req.user.role = (meta.role as UserRole) || (supaUser.email?.endsWith('@civicfix.gov.in') ? 'admin' : 'citizen');

        // Asynchronously upsert user into PostgreSQL database
        if (supaUser.email) {
          getOrCreateUser(
            supaUser.id,
            supaUser.email,
            req.user.name,
            req.user.photoUrl
          ).catch((err) => {
            console.warn('[PostgreSQL] Background user sync notice:', err.message);
          });
        }
      } else if (error) {
        console.log('[Auth] Supabase token verification note:', error.message);
      }
    } catch (supaErr: any) {
      // Non-fatal: retain guest context
      console.log('[Auth] Supabase token verification fallback to guest mode:', supaErr.message);
    }
  }

  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: This action requires municipal administrative privileges.',
      timestamp: new Date().toISOString(),
    });
  }
  next();
}
