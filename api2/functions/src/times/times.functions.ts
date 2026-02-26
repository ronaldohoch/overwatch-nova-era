import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { resolveErrorMessage, resolveErrorStatus } from '../_config/errors';
import { setupExpressApp } from '../_config/setup';
import { authMiddleware } from '../_middlewares/auth';
import { resolveTimesErrorStatus, timesSvc } from './times.service';

const app = setupExpressApp();

function getUid(req: any): string | null {
  const candidate = req?.user?.uid || req?.user?.sub;
  if (typeof candidate !== 'string') return null;

  const normalized = candidate.trim();
  return normalized ? normalized : null;
}

function getRole(req: any): string {
  const value = req?.user?.role;
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function canViewAllTeams(role: string): boolean {
  return role === 'admin' || role === 'streamer';
}

function sendError(res: any, error: unknown, fallbackStatus: number, fallbackMessage: string) {
  const statusCode = resolveTimesErrorStatus(
    error,
    resolveErrorStatus(error, fallbackStatus),
  );

  res.status(statusCode).json({
    statusCode,
    message: resolveErrorMessage(error, fallbackMessage),
  });
}

app.post('/', authMiddleware, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) {
      return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    }

    const team = await timesSvc.createTeam(
      {
        uid,
        role: getRole(req),
      },
      req.body,
    );

    res.status(201).json(team);
    return;
  } catch (error: unknown) {
    logger.error('Erro ao criar time:', error);
    sendError(res, error, 400, 'Bad request');
    return;
  }
});

app.get('/', authMiddleware, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) {
      return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    }

    const role = getRole(req);
    if (!canViewAllTeams(role)) {
      return res.status(403).json({ statusCode: 403, message: 'Access denied' });
    }

    const teams = await timesSvc.listAllTeams();
    res.status(200).json(teams);
    return;
  } catch (error: unknown) {
    logger.error('Erro ao listar todos os times:', error);
    sendError(res, error, 500, 'Nao foi possivel listar os times.');
    return;
  }
});

app.get('/me', authMiddleware, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) {
      return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    }

    const teams = await timesSvc.listMyTeams(uid);
    res.status(200).json(teams);
    return;
  } catch (error: unknown) {
    logger.error('Erro ao listar times do usuario:', error);
    sendError(res, error, 500, 'Nao foi possivel listar seus times.');
    return;
  }
});

app.get('/invites/me', authMiddleware, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) {
      return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    }

    const invites = await timesSvc.listMyPendingInvites(uid);
    res.status(200).json(invites);
    return;
  } catch (error: unknown) {
    logger.error('Erro ao listar convites pendentes:', error);
    sendError(res, error, 500, 'Nao foi possivel listar convites.');
    return;
  }
});

app.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) {
      return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    }

    const updated = await timesSvc.updateTeamData(
      req.params.id,
      {
        uid,
        role: getRole(req),
      },
      req.body,
    );

    res.status(200).json(updated);
    return;
  } catch (error: unknown) {
    logger.error(`Erro ao atualizar time ${req.params.id}:`, error);
    sendError(res, error, 400, 'Bad request');
    return;
  }
});

app.get('/:id', authMiddleware, async (req, res) => {
  try {
    const team = await timesSvc.getTeam(req.params.id);
    res.status(200).json(team);
    return;
  } catch (error: unknown) {
    logger.error(`Erro ao buscar time ${req.params.id}:`, error);
    sendError(res, error, 404, 'Time nao encontrado.');
    return;
  }
});

app.get('/:id/members', authMiddleware, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) {
      return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    }

    const members = await timesSvc.listMembers(req.params.id, {
      uid,
      role: getRole(req),
    });

    res.status(200).json(members);
    return;
  } catch (error: unknown) {
    logger.error(`Erro ao listar membros do time ${req.params.id}:`, error);
    sendError(res, error, 400, 'Bad request');
    return;
  }
});

app.get('/:id/tournaments', authMiddleware, async (req, res) => {
  try {
    const overview = await timesSvc.listTeamTournaments(req.params.id);
    res.status(200).json(overview);
    return;
  } catch (error: unknown) {
    logger.error(`Erro ao listar torneios do time ${req.params.id}:`, error);
    sendError(res, error, 400, 'Bad request');
    return;
  }
});

app.post('/:id/members', authMiddleware, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) {
      return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    }

    const result = await timesSvc.addMember(
      req.params.id,
      {
        uid,
        role: getRole(req),
      },
      req.body,
    );

    res.status(200).json(result);
    return;
  } catch (error: unknown) {
    logger.error(`Erro ao adicionar membro ao time ${req.params.id}:`, error);
    sendError(res, error, 400, 'Bad request');
    return;
  }
});

app.post('/:id/invites/:uid/accept', authMiddleware, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) {
      return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    }

    if (req.params.uid !== uid) {
      return res.status(403).json({ statusCode: 403, message: 'Voce so pode aceitar seus proprios convites.' });
    }

    const result = await timesSvc.acceptInvite(req.params.id, uid);
    res.status(200).json(result);
    return;
  } catch (error: unknown) {
    logger.error(`Erro ao aceitar convite do time ${req.params.id}:`, error);
    sendError(res, error, 400, 'Bad request');
    return;
  }
});

app.post('/:id/invites/:uid/reject', authMiddleware, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) {
      return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    }

    if (req.params.uid !== uid) {
      return res.status(403).json({ statusCode: 403, message: 'Voce so pode recusar seus proprios convites.' });
    }

    const result = await timesSvc.rejectInvite(req.params.id, uid);
    res.status(200).json(result);
    return;
  } catch (error: unknown) {
    logger.error(`Erro ao recusar convite do time ${req.params.id}:`, error);
    sendError(res, error, 400, 'Bad request');
    return;
  }
});

app.delete('/:id/members/me', authMiddleware, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) {
      return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    }

    const result = await timesSvc.leaveTeam(req.params.id, uid);
    res.status(200).json(result);
    return;
  } catch (error: unknown) {
    logger.error(`Erro ao sair do time ${req.params.id}:`, error);
    sendError(res, error, 400, 'Bad request');
    return;
  }
});

app.delete('/:id/members/:uid', authMiddleware, async (req, res) => {
  try {
    const actorUid = getUid(req);
    if (!actorUid) {
      return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    }

    const result = await timesSvc.removeMemberAsAdmin(
      req.params.id,
      {
        uid: actorUid,
        role: getRole(req),
      },
      req.params.uid,
    );

    res.status(200).json(result);
    return;
  } catch (error: unknown) {
    logger.error(`Erro ao remover membro ${req.params.uid} do time ${req.params.id}:`, error);
    sendError(res, error, 400, 'Bad request');
    return;
  }
});

app.post('/:id/captain', authMiddleware, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) {
      return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    }

    const result = await timesSvc.transferCaptain(
      req.params.id,
      {
        uid,
        role: getRole(req),
      },
      req.body,
    );
    res.status(200).json(result);
    return;
  } catch (error: unknown) {
    logger.error(`Erro ao transferir capitania do time ${req.params.id}:`, error);
    sendError(res, error, 400, 'Bad request');
    return;
  }
});

export const times = onRequest({ invoker: 'public' }, app);
