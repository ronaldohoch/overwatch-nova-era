import express from 'express';
import cors from 'cors';

export function setupExpressApp() {
  const app = express();

  app.use(cors({ origin: true }));
  app.use(express.json());

  return app;
}