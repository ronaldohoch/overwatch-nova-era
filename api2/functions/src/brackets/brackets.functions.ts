import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { resolveErrorMessage, resolveErrorStatus } from '../_config/errors';
import { JWT_SECRET } from '../_config/env';
import { setupExpressApp } from '../_config/setup';
import { authMiddleware } from '../_middlewares/auth';
import { rolesMiddleware } from '../_middlewares/roles';
import { UserRole } from '../_enums/role.enum';
import { bracketsSvc } from './brackets.service';

const app = setupExpressApp();
const requireAuth = authMiddleware(() => JWT_SECRET.value());

function sendError(res: any, error: unknown, fallbackStatus: number, fallbackMessage: string) {
  const statusCode = resolveErrorStatus(error, fallbackStatus);
  res.status(statusCode).json({
    statusCode,
    message: resolveErrorMessage(error, fallbackMessage),
  });
}

// POST /brackets/:tournamentId — Gera o bracket (admin)
app.post('/:tournamentId', requireAuth, rolesMiddleware([UserRole.ADMIN]), async (req, res) => {
  try {
    const bracket = await bracketsSvc.createBracket(req.params.tournamentId, req.body);
    res.status(201).json(bracket);
  } catch (error: unknown) {
    logger.error(`Erro ao criar bracket do torneio ${req.params.tournamentId}:`, error);
    sendError(res, error, 400, 'Bad request');
  }
});

// GET /brackets/:tournamentId — Retorna bracket + partidas (autenticado)
app.get('/:tournamentId', requireAuth, async (req, res) => {
  try {
    const bracket = await bracketsSvc.getBracket(req.params.tournamentId);
    res.status(200).json(bracket);
  } catch (error: unknown) {
    logger.error(`Erro ao buscar bracket do torneio ${req.params.tournamentId}:`, error);
    sendError(res, error, 404, 'Não encontrado');
  }
});

// PATCH /brackets/:tournamentId/matches/:matchNumber — Registra resultado (admin/streamer)
app.patch(
  '/:tournamentId/matches/:matchNumber',
  requireAuth,
  rolesMiddleware([UserRole.ADMIN, UserRole.STREAMER]),
  async (req, res) => {
    try {
      const matchNumber = parseInt(req.params.matchNumber, 10);
      if (!Number.isInteger(matchNumber) || matchNumber < 1) {
        return res.status(400).json({ statusCode: 400, message: 'matchNumber inválido.' });
      }

      const result = await bracketsSvc.reportMatchResult(req.params.tournamentId, matchNumber, req.body);
      res.status(200).json(result);
      return;
    } catch (error: unknown) {
      logger.error(
        `Erro ao registrar resultado da partida ${req.params.matchNumber} do torneio ${req.params.tournamentId}:`,
        error,
      );
      sendError(res, error, 400, 'Bad request');
      return;
    }
  },
);

// DELETE /brackets/:tournamentId — Remove bracket (admin)
app.delete('/:tournamentId', requireAuth, rolesMiddleware([UserRole.ADMIN]), async (req, res) => {
  try {
    await bracketsSvc.deleteBracket(req.params.tournamentId);
    res.status(204).send();
  } catch (error: unknown) {
    logger.error(`Erro ao remover bracket do torneio ${req.params.tournamentId}:`, error);
    sendError(res, error, 404, 'Não encontrado');
  }
});

export const brackets = onRequest({ secrets: [JWT_SECRET], invoker: 'public' }, app);
