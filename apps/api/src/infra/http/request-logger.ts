import type { MiddlewareHandler } from 'hono';
import { logger } from '../logger';
import type { AppEnv } from './context';

const IGNORED_PATHS = new Set(['/api/health']);

/** Uma linha por requisição: método, caminho, status e duração. */
export const requestLogger: MiddlewareHandler<AppEnv> = async (c, next) => {
  const started = performance.now();
  try {
    await next();
  } finally {
    if (!IGNORED_PATHS.has(c.req.path)) {
      logger.info(
        {
          method: c.req.method,
          path: c.req.path,
          status: c.res.status,
          ms: Math.round(performance.now() - started),
        },
        'request',
      );
    }
  }
};
