import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../_enums/role.enum';

type RequestWithUser = Request & {
  user?: Record<string, unknown>;
};

function normalizeRole(value: unknown): UserRole | null {
  if (typeof value !== 'string') return null;

  const role = value.trim().toLowerCase();

  if (role === UserRole.ADMIN) return UserRole.ADMIN;
  if (role === UserRole.STREAMER) return UserRole.STREAMER;
  if (role === UserRole.COMPETIDOR) return UserRole.COMPETIDOR;

  return null;
}

function readUserRoles(user: Record<string, unknown>): UserRole[] {
  const roles = new Set<UserRole>();

  const directRole = normalizeRole(user.role);
  if (directRole) roles.add(directRole);

  const roleList = user.roles;
  if (Array.isArray(roleList)) {
    for (const role of roleList) {
      const normalizedRole = normalizeRole(role);
      if (normalizedRole) roles.add(normalizedRole);
    }
  }

  return Array.from(roles);
}

export const rolesMiddleware = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowedRoles.length) {
      next();
      return;
    }

    const user = (req as RequestWithUser).user;

    if (!user || typeof user !== 'object') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userRoles = readUserRoles(user);

    // Algumas rotas desta API não usam controle de role no token.
    if (!userRoles.length) {
      next();
      return;
    }

    const hasRole = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    next();
  };
};
