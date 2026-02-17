import express from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { authSvc } from './auth.service';
import { setupExpressApp } from '../_config/setup';

const app = setupExpressApp();

app.post('/signup', async (req: express.Request, res: express.Response) => {
  const { displayName, email, battletag, password } = req.body;

  try {
    const result = await authSvc.signUp({
      displayName,
      email,
      battletag,
      password,
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Bad request' });
  }
});

app.post('/login', async (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;

  try {
    const result = await authSvc.signIn(email, password);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Unauthorized' });
  }
});

export const auth = onRequest(app);
