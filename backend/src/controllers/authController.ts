import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { generateToken, AuthUser } from '../middleware/auth';
import { config } from '../config';
import { logger } from '../utils/logger';

// POST /auth/login — local dev login (by email)
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (config.auth.mode === 'azure') {
      res.status(400).json({ error: 'Use /auth/azure/login for Azure AD authentication' });
      return;
    }

    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.active) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      department: user.department,
    };

    const token = generateToken(authUser);

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    logger.info('User logged in', { email: user.email, role: user.role });
    res.json({ user: authUser, token });
  } catch (error) {
    next(error);
  }
}

// GET /auth/me — get current user
export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ user: req.user });
}

// POST /auth/logout
export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
}

// GET /auth/users — list users (admin)
export async function listUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        displayName: true,
        email: true,
        role: true,
        department: true,
        active: true,
      },
      orderBy: { displayName: 'asc' },
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
}
