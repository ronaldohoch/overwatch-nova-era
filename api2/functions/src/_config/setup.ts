import express from 'express';
import cors from 'cors';
import { corsOptions } from './cors';

export function setupExpressApp() {
  const app = express();

  app.use(cors(corsOptions));
  app.use(express.json({ limit: '8mb' }));

  return app;
}
