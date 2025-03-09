import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha512').update(password).digest('hex');
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    company: string;
    roleId: string;
  };
}

export async function authenticateUser(username: string, password: string) {
  console.log('Attempting to authenticate user:', username);
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    console.log('Found user:', user ? 'yes' : 'no');

    if (!user || user.passwordHash !== hashPassword(password)) {
      console.log('Authentication failed: Invalid credentials');
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company,
      roleId: user.roleId
    };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = req.session.user;
  next();
}