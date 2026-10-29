import { createRouter } from '../../../infra/http/context';
import { db } from '../../../infra/prisma/client';

export const healthRouter = createRouter();

healthRouter.get('/health', async (c) => {
  let dbStatus: 'ok' | 'error' = 'ok';
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }
  return c.json(
    { status: dbStatus === 'ok' ? 'ok' : 'degraded', db: dbStatus },
    dbStatus === 'ok' ? 200 : 503,
  );
});
