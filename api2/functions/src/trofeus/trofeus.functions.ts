import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { resolveErrorMessage, resolveErrorStatus } from '../_config/errors';
import { JWT_SECRET } from '../_config/env';
import { setupExpressApp } from '../_config/setup';
import { authMiddleware } from '../_middlewares/auth';
import { resolveTrofeusErrorStatus, trofeusSvc } from './trofeus.service';

const app = setupExpressApp();
const requireAuth = authMiddleware(() => JWT_SECRET.value());

function getUid(req: any): string | null {
  const candidate = req?.user?.uid || req?.user?.sub;
  if (typeof candidate !== 'string') return null;

  const normalized = candidate.trim();
  return normalized || null;
}

function getRole(req: any): string {
  const value = req?.user?.role;
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function sendError(res: any, error: unknown, fallbackStatus: number, fallbackMessage: string) {
  const statusCode = resolveTrofeusErrorStatus(
    error,
    resolveErrorStatus(error, fallbackStatus),
  );

  res.status(statusCode).json({
    statusCode,
    message: resolveErrorMessage(error, fallbackMessage),
  });
}

app.get('/', requireAuth, async (_req, res) => {
  try {
    const catalog = await trofeusSvc.listCatalog();
    res.status(200).json(catalog);
    return;
  } catch (error: unknown) {
    logger.error('Erro ao listar trofeus:', error);
    sendError(res, error, 500, 'Nao foi possivel listar os trofeus.');
    return;
  }
});

app.post('/', requireAuth, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) {
      res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
      return;
    }

    const trophy = await trofeusSvc.createCatalogTrophy(
      {
        uid,
        role: getRole(req),
      },
      req.body,
    );

    res.status(201).json(trophy);
    return;
  } catch (error: unknown) {
    logger.error('Erro ao cadastrar trofeu:', error);
    sendError(res, error, 400, 'Bad request');
    return;
  }
});

app.post('/award', requireAuth, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) {
      res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
      return;
    }

    const result = await trofeusSvc.awardManual(
      {
        uid,
        role: getRole(req),
      },
      req.body,
    );

    res.status(200).json(result);
    return;
  } catch (error: unknown) {
    logger.error('Erro ao conceder trofeu manualmente:', error);
    sendError(res, error, 400, 'Bad request');
    return;
  }
});

export const trofeus = onRequest({ secrets: [JWT_SECRET], invoker: 'public' }, app);
