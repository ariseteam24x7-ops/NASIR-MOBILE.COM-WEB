import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
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

const SESSION_SECRET = process.env.SESSION_SECRET || '';

if (Buffer.byteLength(SESSION_SECRET, 'utf8') < 32) {
  throw new Error('SESSION_SECRET must be configured with at least 32 bytes before the server can start.');
}

export const adminSessions = new Map<string, SessionPayload>();

const isValidPayload = (value: any): value is SessionPayload =>
  value !== null &&
  typeof value === 'object' &&
  typeof value.uid === 'string' &&
  value.uid.length > 0 &&
  typeof value.email === 'string' &&
  value.email.length > 0 &&
  (value.role === 'owner' || value.role === 'admin') &&
  Number.isSafeInteger(value.expiresAt) &&
  value.expiresAt > Date.now();

const signatureFor = (data: string): string =>
  crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');

export const createSignedToken = (payload: SessionPayload): string => {
  if (!isValidPayload(payload)) {
    throw new Error('Cannot create a session with an invalid payload.');
  }

  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const token = `nm_sess_${data}.${signatureFor(data)}`;
  adminSessions.set(token, payload);
  return token;
};

export const verifySignedToken = (token: string): SessionPayload | null => {
  if (typeof token !== 'string' || !token.startsWith('nm_sess_')) return null;

  // Only sessions issued by this running process are valid.
  // Deleting a token on logout therefore revokes it permanently.
  if (!adminSessions.has(token)) return null;

  const parts = token.slice('nm_sess_'.length).split('.');
  if (parts.length !== 2) return null;

  const [data, suppliedSignature] = parts;
  if (!data || !suppliedSignature) return null;

  const expected = Buffer.from(signatureFor(data));
  const supplied = Buffer.from(suppliedSignature);

  if (
    expected.length !== supplied.length ||
    !crypto.timingSafeEqual(expected, supplied)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!isValidPayload(payload)) return null;

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
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';
  const adminToken =
    (req.headers['x-admin-token'] as string | undefined) || bearerToken;

  if (!adminToken) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication credentials' });
  }

  const session = verifySignedToken(adminToken);

  if (!session) {
    adminSessions.delete(adminToken);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
  }

  try {
    const account = await db
      .select()
      .from(users)
      .where(eq(users.uid, session.uid))
      .limit(1);

    if (
      account.length !== 1 ||
      account[0].email.toLowerCase() !== session.email.toLowerCase() ||
      account[0].role !== session.role ||
      (account[0].role !== 'owner' && account[0].role !== 'admin')
    ) {
      adminSessions.delete(adminToken);
      return res.status(403).json({ error: 'Forbidden: Account is not authorized' });
    }

    req.user = {
      uid: account[0].uid,
      email: account[0].email,
      role: account[0].role,
    };

    return next();
  } catch (error) {
    console.error('Authentication account check failed:', error);
    return res.status(503).json({ error: 'Unable to verify account authorization' });
  }
};
