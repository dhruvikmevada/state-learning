import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

// Require specific roles
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
}

// Permission definitions
export const Permissions = {
  VIEW_DASHBOARD: [Role.ADMIN, Role.PM, Role.PMO, Role.DEPARTMENT_APPROVER, Role.EXECUTIVE_READONLY],
  SUBMIT_LESSON: [Role.ADMIN, Role.PM, Role.PMO, Role.DEPARTMENT_APPROVER, Role.STANDARD_CONTRIBUTOR],
  VIEW_REGISTER: [Role.ADMIN, Role.PM, Role.PMO, Role.DEPARTMENT_APPROVER, Role.EXECUTIVE_READONLY, Role.STANDARD_CONTRIBUTOR],
  APPROVE_PM: [Role.ADMIN, Role.PM],
  APPROVE_PMO: [Role.ADMIN, Role.PMO],
  APPROVE_DEPARTMENT: [Role.ADMIN, Role.DEPARTMENT_APPROVER],
  MANAGE_CONFIG: [Role.ADMIN],
  MANAGE_USERS: [Role.ADMIN],
} as const;

// Check if user can perform action
export function canPerform(role: Role, permission: keyof typeof Permissions): boolean {
  return (Permissions[permission] as readonly Role[]).includes(role);
}

// Middleware using permission keys
export function requirePermission(permission: keyof typeof Permissions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!canPerform(req.user.role, permission)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        requiredPermission: permission,
        currentRole: req.user.role,
      });
      return;
    }

    next();
  };
}
