import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
  };
}

export interface SessionPayload {
  uid: string;
  email: string;
  role: string;
  expiresAt: number;
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'nasir-mobile-dubai-secret-2026';

// In-memory cache for fast lookups
export const adminSessions = new Map<string, SessionPayload>();

// Generate a cryptographically signed HMAC token that persists across server restarts
export const createSignedToken = (payload: SessionPayload): string => {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  const token = `nm_sess_${data}.${hmac}`;
  adminSessions.set(token, payload);
  return token;
};

// Verify HMAC signed token (checks cache first, then verifies signature if server restarted)
export const verifySignedToken = (token: string): SessionPayload | null => {
  if (adminSessions.has(token)) {
    const session = adminSessions.get(token)!;
    if (Date.now() < session.expiresAt) {
      return session;
    }
    adminSessions.delete(token);
    return null;
  }

  if (!token.startsWith('nm_sess_')) return null;
  const raw = token.slice('nm_sess_'.length);
  const parts = raw.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  if (sig !== expectedSig) return null;

  try {
    const payload: SessionPayload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (Date.now() > payload.expiresAt) return null;
    // Cache verified session
    adminSessions.set(token, payload);
    return payload;
  } catch {
    return null;
  }
};

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const adminToken = (req.headers['x-admin-token'] as string | undefined) ||
    (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1].trim() : undefined);

  if (!adminToken) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication credentials' });
  }

  // 1. Verify custom signed admin token
  const validSession = verifySignedToken(adminToken);
  if (validSession) {
    req.user = { uid: validSession.uid, email: validSession.email, role: validSession.role };
    return next();
  }

  // 2. Otherwise, check if token is a Firebase Auth ID Token
  try {
    const decodedToken = await adminAuth.verifyIdToken(adminToken);
    const email = decodedToken.email?.toLowerCase() || '';

    // Verify if user is an authorized owner
    const configuredOwnerEmail = (process.env.OWNER_EMAIL || 'shazzzbusiness@gmail.com').toLowerCase();
    
    let isOwner = email === configuredOwnerEmail;
    
    if (!isOwner && email) {
      const dbUsers = await db.select().from(users).where(eq(users.email, email));
      if (dbUsers.length > 0 && (dbUsers[0].role === 'owner' || dbUsers[0].role === 'admin')) {
        isOwner = true;
      }
    }

    if (!isOwner) {
      return res.status(403).json({ 
        error: 'Forbidden: Access restricted to authorized Nasir Mobile store owner.' 
      });
    }

    req.user = {
      uid: decodedToken.uid,
      email: email,
      role: 'owner',
    };
    next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};
