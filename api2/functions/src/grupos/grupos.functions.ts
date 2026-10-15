import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { resolveErrorMessage, resolveErrorStatus } from '../_config/errors';
import { JWT_SECRET } from '../_config/env';
import { setupExpressApp } from '../_config/setup';
import { authMiddleware } from '../_middlewares/auth';
import { rolesMiddleware } from '../_middlewares/roles';
import { UserRole } from '../_enums/role.enum';
import { gruposSvc } from './grupos.service';

const app = setupExpressApp();
const requireAuth = authMiddleware(() => JWT_SECRET.value());

function sendError(res: any, error: unknown, fallbackStatus: number, fallbackMessage: string) {
  const statusCode = resolveErrorStatus(error, fallbackStatus);
  res.status(statusCode).json({
    statusCode,
    message: resolveErrorMessage(error, fallbackMessage),
  });
}

// POST /grupos/:tournamentId — Gera os grupos e as partidas (admin)
app.post('/:tournamentId', requireAuth, rolesMiddleware([UserRole.ADMIN]), async (req, res) => {
  try {
    const stage = await gruposSvc.createGroupStage(req.params.tournamentId, req.body);
    res.status(201).json(stage);
  } catch (error: unknown) {
    logger.error(`Erro ao criar grupos do torneio ${req.params.tournamentId}:`, error);
    sendError(res, error, 400, 'Bad request');
  }
});

// GET /grupos/:tournamentId — Grupos, partidas e classificação (público)
app.get('/:tournamentId', async (req, res) => {
  try {
    const stage = await gruposSvc.getGroupStage(req.params.tournamentId);
    res.status(200).json(stage);
  } catch (error: unknown) {
    logger.error(`Erro ao buscar grupos do torneio ${req.params.tournamentId}:`, error);
    sendError(res, error, 404, 'Não encontrado');
  }
});

// PATCH /grupos/:tournamentId/matches/:matchNumber — Registra ou corrige resultado (admin/streamer)
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

      const result = await gruposSvc.reportMatchResult(req.params.tournamentId, matchNumber, req.body);
      res.status(200).json(result);
      return;
    } catch (error: unknown) {
      logger.error(
        `Erro ao registrar resultado da partida ${req.params.matchNumber} dos grupos do torneio ${req.params.tournamentId}:`,
        error,
      );
      sendError(res, error, 400, 'Bad request');
      return;
    }
  },
);

// PATCH /grupos/:tournamentId/groups/:letter/order — Desempate manual (admin)
app.patch(
  '/:tournamentId/groups/:letter/order',
  requireAuth,
  rolesMiddleware([UserRole.ADMIN]),
  async (req, res) => {
    try {
      await gruposSvc.setManualOrder(req.params.tournamentId, req.params.letter, req.body?.teamIds);
      res.status(200).json({ message: 'Ordem do grupo atualizada.' });
    } catch (error: unknown) {
      logger.error(`Erro ao ordenar grupo ${req.params.letter} do torneio ${req.params.tournamentId}:`, error);
      sendError(res, error, 400, 'Bad request');
    }
  },
);

// POST /grupos/:tournamentId/knockout — Gera o mata-mata com os classificados (admin)
app.post('/:tournamentId/knockout', requireAuth, rolesMiddleware([UserRole.ADMIN]), async (req, res) => {
  try {
    const bracket = await gruposSvc.generateKnockout(req.params.tournamentId);
    res.status(201).json(bracket);
  } catch (error: unknown) {
    logger.error(`Erro ao gerar mata-mata do torneio ${req.params.tournamentId}:`, error);
    sendError(res, error, 400, 'Bad request');
  }
});

// DELETE /grupos/:tournamentId — Remove a fase de grupos (admin)
app.delete('/:tournamentId', requireAuth, rolesMiddleware([UserRole.ADMIN]), async (req, res) => {
  try {
    await gruposSvc.deleteGroupStage(req.params.tournamentId);
    res.status(204).send();
  } catch (error: unknown) {
    logger.error(`Erro ao remover grupos do torneio ${req.params.tournamentId}:`, error);
    sendError(res, error, 400, 'Bad request');
  }
});

export const grupos = onRequest({ secrets: [JWT_SECRET], invoker: 'public' }, app);
