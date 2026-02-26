import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { resolveErrorMessage, resolveErrorStatus } from '../_config/errors';
import { JWT_SECRET } from '../_config/env';
import { setupExpressApp } from '../_config/setup';
import { authMiddleware } from '../_middlewares/auth';
import { rolesMiddleware } from '../_middlewares/roles';
import { UserRole } from '../_enums/role.enum';
import { torneiosSvc } from './torneios.service';

const app = setupExpressApp();
const requireAuth = authMiddleware(() => JWT_SECRET.value());

function getUid(req: any) {
  return req?.user?.uid || req?.user?.sub || null;
}

function getRole(req: any): string {
  const value = req?.user?.role;
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function readRoleFilter(raw: unknown): 'all' | 'tank' | 'dps' | 'support' {
  if (typeof raw !== 'string') return 'all';

  const value = raw.trim().toLowerCase();
  if (value === 'tank' || value === 'dps' || value === 'support') return value;
  return 'all';
}

function sendError(res: any, error: unknown, fallbackStatus: number, fallbackMessage: string) {
  const statusCode = resolveErrorStatus(error, fallbackStatus);
  res.status(statusCode).json({
    statusCode,
    message: resolveErrorMessage(error, fallbackMessage),
  });
}

// CRUD
app.post('/', requireAuth, rolesMiddleware([UserRole.ADMIN]), async (req, res) => {
  try {
    const uid = getUid(req);
    const newTournament = await torneiosSvc.create(req.body, uid);
    res.status(201).json(newTournament);
  } catch (error: unknown) {
    logger.error('Erro ao criar torneio:', error);
    sendError(res, error, 400, 'Bad request');
  }
});

app.get('/', async (req, res) => {
  try {
    const tournaments = await torneiosSvc.findAll();
    res.status(200).json(tournaments);
  } catch (error: unknown) {
    logger.error('Erro ao buscar torneios:', error);
    sendError(res, error, 500, 'Erro ao buscar torneios.');
  }
});

app.get('/:id', async (req, res) => {
  try {
    const tournament = await torneiosSvc.findOne(req.params.id);
    res.status(200).json(tournament);
  } catch (error: unknown) {
    logger.error(`Erro ao buscar torneio ${req.params.id}:`, error);
    sendError(res, error, 404, 'Nao encontrado');
  }
});

// RANDOM: listar check-ins por torneio (streamer/admin)
app.get(
  '/:id/checkins',
  requireAuth,
  rolesMiddleware([UserRole.ADMIN, UserRole.STREAMER]),
  async (req, res) => {
    try {
      const role = getRole(req);
      if (role !== UserRole.ADMIN && role !== UserRole.STREAMER) {
        return res.status(403).json({ statusCode: 403, message: 'Access denied' });
      }

      const roleFilter = readRoleFilter(req.query?.role);
      const checkins = await torneiosSvc.listRandomCheckins(req.params.id, roleFilter);
      return res.status(200).json(checkins);
    } catch (error: unknown) {
      logger.error(`Erro ao buscar check-ins do torneio ${req.params.id}:`, error);
      sendError(res, error, 400, 'Bad request');
      return;
    }
  },
);

// RANDOM: disponibilidade de check-ins por role (autenticado)
app.get('/:id/checkins/availability-by-role', requireAuth, async (req, res) => {
  try {
    const availability = await torneiosSvc.getRandomCheckinAvailabilityByRole(req.params.id);
    res.status(200).json(availability);
  } catch (error: unknown) {
    logger.error(`Erro ao buscar disponibilidade de check-ins por role no torneio ${req.params.id}:`, error);
    sendError(res, error, 400, 'Bad request');
  }
});

app.patch('/:id', requireAuth, rolesMiddleware([UserRole.ADMIN]), async (req, res) => {
  try {
    const updated = await torneiosSvc.update(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (error: unknown) {
    logger.error(`Erro ao atualizar torneio ${req.params.id}:`, error);
    sendError(res, error, 400, 'Bad request');
  }
});

app.delete('/:id', requireAuth, rolesMiddleware([UserRole.ADMIN]), async (req, res) => {
  try {
    await torneiosSvc.remove(req.params.id);
    res.status(204).send();
  } catch (error: unknown) {
    logger.error(`Erro ao remover torneio ${req.params.id}:`, error);
    sendError(res, error, 404, 'Nao encontrado');
  }
});

// status
app.post('/:id/status', requireAuth, rolesMiddleware([UserRole.ADMIN]), async (req, res) => {
  try {
    const updated = await torneiosSvc.setStatus(req.params.id, req.body?.status);
    res.status(200).json(updated);
  } catch (error: unknown) {
    logger.error(`Erro ao alterar status do torneio ${req.params.id}:`, error);
    sendError(res, error, 400, 'Bad request');
  }
});

// RANDOM: check-in do jogador
app.post('/:id/checkin', requireAuth, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });

    const result = await torneiosSvc.checkinRandom(req.params.id, uid, req.body);
    res.status(200).json(result);
    return;
  } catch (error: unknown) {
    logger.error(`Erro no check-in do torneio ${req.params.id}:`, error);
    sendError(res, error, 400, 'Bad request');
    return;
  }
});

// CLOSED: criar time
app.post('/:id/teams', requireAuth, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });

    const team = await torneiosSvc.createClosedTeam(req.params.id, uid, req.body);
    res.status(201).json(team);
    return;
  } catch (error: unknown) {
    logger.error(`Erro ao criar time no torneio ${req.params.id}:`, error);
    sendError(res, error, 400, 'Bad request');
    return;
  }
});

// CLOSED: check-in do time
app.post('/:id/teams/:teamId/checkin', requireAuth, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });

    const team = await torneiosSvc.checkinClosedTeam(req.params.id, req.params.teamId, uid);
    res.status(200).json(team);
    return;
  } catch (error: unknown) {
    logger.error(`Erro ao fazer check-in do time ${req.params.teamId}:`, error);
    sendError(res, error, 400, 'Bad request');
    return;
  }
});

// RANDOM: lock + draw (admin)
app.post(
  '/:id/lock-and-draw',
  requireAuth,
  rolesMiddleware([UserRole.ADMIN]),
  async (req, res) => {
    try {
      const uid = getUid(req);
      const result = await torneiosSvc.lockAndDrawRandomTeams(req.params.id, uid);
      res.status(200).json(result);
    } catch (error: unknown) {
      logger.error(`Erro no lock-and-draw do torneio ${req.params.id}:`, error);
      sendError(res, error, 400, 'Bad request');
    }
  },
);

export const torneios = onRequest({ secrets: [JWT_SECRET], invoker: 'public' }, app);
