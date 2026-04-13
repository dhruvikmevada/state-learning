import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  department: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, department: user.department, displayName: user.displayName },
    config.auth.jwtSecret,
    { expiresIn: config.auth.tokenExpiry as string }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, config.auth.jwtSecret) as AuthUser;
  } catch {
    return null;
  }
}

// Auth middleware — verifies JWT from Authorization header or cookie
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.active) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      department: user.department,
    };

    next();
  } catch (error) {
    logger.error('Authentication error', { error });
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// Optional auth — attaches user if token present but doesn't block
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (user && user.active) {
          req.user = {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            department: user.department,
          };
        }
      }
    }
  } catch {
    // Ignore auth errors in optional mode
  }
  next();
}
