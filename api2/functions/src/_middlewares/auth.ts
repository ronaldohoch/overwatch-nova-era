import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../auth/auth.service';

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

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = readToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const decoded = verifyToken(token);

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
