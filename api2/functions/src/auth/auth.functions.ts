import express from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { authSvc, verifyToken } from './auth.service';
import { setupExpressApp } from '../_config/setup';
import { resolveErrorMessage, resolveErrorStatus } from '../_config/errors';
import { authMiddleware } from '../_middlewares/auth';
import { rolesMiddleware } from '../_middlewares/roles';
import { UserRole } from '../_enums/role.enum';

const app = setupExpressApp();

app.post('/signup', async (req: express.Request, res: express.Response) => {
  const { displayName, email, battletag, password, whatsapp } = req.body;

  try {
    const result = await authSvc.signUp({
      displayName,
      email,
      battletag,
      password,
      whatsapp
    });

    res.status(201).json(result);
  } catch (err: unknown) {
    res
      .status(resolveErrorStatus(err, 400))
      .json({ error: resolveErrorMessage(err, 'Bad request') });
  }
});

app.put('/me', async (req: express.Request, res: express.Response) => {
  const userId = readAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Token invalido.' });
    return;
  }

  const { displayName, email, whatsapp } = req.body ?? {};

  try {
    const result = await authSvc.updateMe(userId, {
      displayName,
      email,
      whatsapp,
    });

    res.status(200).json(result);
  } catch (err: unknown) {
    res
      .status(resolveErrorStatus(err, 400))
      .json({ error: resolveErrorMessage(err, 'Bad request') });
  }
});

app.put('/me/password', async (req: express.Request, res: express.Response) => {
  const userId = readAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Token invalido.' });
    return;
  }

  const { currentPassword, newPassword } = req.body ?? {};

  try {
    await authSvc.changePassword(userId, {
      currentPassword,
      newPassword,
    });

    res.status(204).send();
  } catch (err: unknown) {
    res
      .status(resolveErrorStatus(err, 400))
      .json({ error: resolveErrorMessage(err, 'Bad request') });
  }
});

app.post('/forgot-password', async (req: express.Request, res: express.Response) => {
  try {
    await authSvc.requestPasswordReset(req.body ?? {});
    res.status(200).json({ message: 'Se o e-mail existir, você receberá um link em breve.' });
  } catch (err: unknown) {
    res
      .status(resolveErrorStatus(err, 400))
      .json({ error: resolveErrorMessage(err, 'Bad request') });
  }
});

app.post('/reset-password', async (req: express.Request, res: express.Response) => {
  try {
    await authSvc.resetPassword(req.body ?? {});
    res.status(200).json({ message: 'Senha alterada com sucesso.' });
  } catch (err: unknown) {
    res
      .status(resolveErrorStatus(err, 400))
      .json({ error: resolveErrorMessage(err, 'Bad request') });
  }
});

app.post('/login', async (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;

  try {
    const result = await authSvc.signIn(email, password);
    res.status(200).json(result);
  } catch (err: unknown) {
    res
      .status(resolveErrorStatus(err, 401))
      .json({ error: resolveErrorMessage(err, 'Unauthorized') });
  }
});

app.get(
  '/users',
  authMiddleware,
  rolesMiddleware([UserRole.ADMIN]),
  async (req: express.Request, res: express.Response) => {
    const user = (req as express.Request & { user?: Record<string, unknown> }).user;
    const role = typeof user?.['role'] === 'string' ? user.role.trim().toLowerCase() : '';

    if (role !== UserRole.ADMIN) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    try {
      const users = await authSvc.listUsers();
      res.status(200).json(users);
    } catch (err: unknown) {
      res
        .status(resolveErrorStatus(err, 500))
        .json({ error: resolveErrorMessage(err, 'Erro ao listar usuarios.') });
    }
  },
);

function readAuthenticatedUserId(req: express.Request): string | null {
  const headerValue = req.header('authorization');
  const token = readBearerToken(headerValue);
  if (!token) return null;

  try {
    const decoded = verifyToken(token);
    if (!decoded || typeof decoded !== 'object') return null;

    const subject = (decoded as Record<string, unknown>)['sub'];
    return typeof subject === 'string' && subject.trim() ? subject : null;
  } catch {
    return null;
  }
}

function readBearerToken(headerValue: string | undefined): string | null {
  if (!headerValue) return null;

  const [scheme, token] = headerValue.split(' ');
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;

  return token;
}

export const auth = onRequest({ invoker: 'public' }, app);
