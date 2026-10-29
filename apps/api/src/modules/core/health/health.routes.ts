import { sql } from 'drizzle-orm';
import { db } from '../../../db/client';
import { createRouter } from '../../../infra/http/context';

export const healthRouter = createRouter();

healthRouter.get('/health', async (c) => {
  let dbStatus: 'ok' | 'error' = 'ok';
  try {
    await db().run(sql`select 1`);
  } catch {
    dbStatus = 'error';
  }
  return c.json(
    { status: dbStatus === 'ok' ? 'ok' : 'degraded', db: dbStatus },
    dbStatus === 'ok' ? 200 : 503,
  );
});
