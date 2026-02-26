import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

type RequestWithUser = Request & {
  user?: Record<string, unknown>;
};

function readToken(authorizationHeader?: string): string | null {
  if (!authorizationHeader) return null;

  const trimmedHeader = authorizationHeader.trim();
  if (!trimmedHeader) return null;

  const [scheme, token] = trimmedHeader.split(/\s+/);

  if (scheme.toLowerCase() === 'bearer') {
    return token ?? null;
  }

  return trimmedHeader;
}

export const authMiddleware = (resolveJwtSecret: () => string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = readToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    try {
      const decoded = jwt.verify(token, resolveJwtSecret());

      if (!decoded || typeof decoded !== 'object') {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      (req as RequestWithUser).user = decoded as Record<string, unknown>;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
};
