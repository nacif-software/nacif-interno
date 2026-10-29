import type { Role } from '@nacif/shared';
import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from './context';
import { ForbiddenError } from './errors';

/** Deve vir depois de requireAuth. */
export function requireRole(...roles: Role[]): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (!roles.includes(c.get('user').role)) throw new ForbiddenError();
    await next();
  };
}
