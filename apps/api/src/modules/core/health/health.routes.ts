import { Router } from 'express';
import { db } from '../../../infra/prisma/client';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  let dbStatus: 'ok' | 'error' = 'ok';
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }
  res
    .status(dbStatus === 'ok' ? 200 : 503)
    .json({ status: dbStatus === 'ok' ? 'ok' : 'degraded', db: dbStatus });
});
