import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { setupExpressApp } from '../_config/setup';
import { authMiddleware } from '../_middlewares/auth';
import { rolesMiddleware } from '../_middlewares/roles';
import { UserRole } from '../_enums/role.enum';
import { torneiosSvc } from './torneios.service';

const app = setupExpressApp();

function getUid(req: any) {
  return req?.user?.uid || req?.user?.sub || null;
}

// CRUD
app.post('/', authMiddleware, rolesMiddleware([UserRole.ADMIN]), async (req, res) => {
  try {
    const uid = getUid(req);
    const newTournament = await torneiosSvc.create(req.body, uid);
    res.status(201).json(newTournament);
  } catch (error: any) {
    logger.error('Erro ao criar torneio:', error);
    res.status(400).json({ statusCode: 400, message: error?.message || 'Bad request' });
  }
});

app.get('/', async (req, res) => {
  try {
    const tournaments = await torneiosSvc.findAll();
    res.status(200).json(tournaments);
  } catch (error) {
    logger.error('Erro ao buscar torneios:', error);
    res.status(500).json({ statusCode: 500, message: 'Erro ao buscar torneios.' });
  }
});

app.get('/:id', async (req, res) => {
  try {
    const tournament = await torneiosSvc.findOne(req.params.id);
    res.status(200).json(tournament);
  } catch (error: any) {
    logger.error(`Erro ao buscar torneio ${req.params.id}:`, error);
    res.status(404).json({ statusCode: 404, message: error?.message || 'Não encontrado' });
  }
});

app.patch('/:id', authMiddleware, rolesMiddleware([UserRole.ADMIN]), async (req, res) => {
  try {
    const updated = await torneiosSvc.update(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (error: any) {
    logger.error(`Erro ao atualizar torneio ${req.params.id}:`, error);
    res.status(400).json({ statusCode: 400, message: error?.message || 'Bad request' });
  }
});

app.delete('/:id', authMiddleware, rolesMiddleware([UserRole.ADMIN]), async (req, res) => {
  try {
    await torneiosSvc.remove(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    logger.error(`Erro ao remover torneio ${req.params.id}:`, error);
    res.status(404).json({ statusCode: 404, message: error?.message || 'Não encontrado' });
  }
});

// status
app.post('/:id/status', authMiddleware, rolesMiddleware([UserRole.ADMIN]), async (req, res) => {
  try {
    const updated = await torneiosSvc.setStatus(req.params.id, req.body?.status);
    res.status(200).json(updated);
  } catch (error: any) {
    logger.error(`Erro ao alterar status do torneio ${req.params.id}:`, error);
    res.status(400).json({ statusCode: 400, message: error?.message || 'Bad request' });
  }
});

// RANDOM: check-in do jogador
app.post('/:id/checkin', authMiddleware, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });

    const result = await torneiosSvc.checkinRandom(req.params.id, uid, req.body);
    res.status(200).json(result);
    return;
  } catch (error: any) {
    logger.error(`Erro no check-in do torneio ${req.params.id}:`, error);
    res.status(400).json({ statusCode: 400, message: error?.message || 'Bad request' });
    return;
  }
});

// CLOSED: criar time
app.post('/:id/teams', authMiddleware, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });

    const team = await torneiosSvc.createClosedTeam(req.params.id, uid, req.body);
    res.status(201).json(team);
    return;
  } catch (error: any) {
    logger.error(`Erro ao criar time no torneio ${req.params.id}:`, error);
    res.status(400).json({ statusCode: 400, message: error?.message || 'Bad request' });
    return;
  }
});

// CLOSED: check-in do time
app.post('/:id/teams/:teamId/checkin', authMiddleware, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });

    const team = await torneiosSvc.checkinClosedTeam(req.params.id, req.params.teamId, uid);
    res.status(200).json(team);
    return;
  } catch (error: any) {
    logger.error(`Erro ao fazer check-in do time ${req.params.teamId}:`, error);
    res.status(400).json({ statusCode: 400, message: error?.message || 'Bad request' });
    return;
  }
});

// RANDOM: lock + draw (admin)
app.post(
  '/:id/lock-and-draw',
  authMiddleware,
  rolesMiddleware([UserRole.ADMIN]),
  async (req, res) => {
    try {
      const uid = getUid(req);
      const result = await torneiosSvc.lockAndDrawRandomTeams(req.params.id, uid);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error(`Erro no lock-and-draw do torneio ${req.params.id}:`, error);
      res.status(400).json({ statusCode: 400, message: error?.message || 'Bad request' });
    }
  },
);

export const torneios = onRequest(app);
