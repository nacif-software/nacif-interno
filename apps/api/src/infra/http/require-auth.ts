import type { MiddlewareHandler } from 'hono';
import { sessionService } from '../../modules/core/auth/session.service';
import type { AppEnv } from './context';
import { UnauthenticatedError } from './errors';

export type { AuthenticatedUser } from './context';

/** Carrega a sessão do cookie e popula `c.get('user')`. 401 se ausente, expirada ou usuário inativo. */
export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = sessionService.readToken(c);
  if (!token) throw new UnauthenticatedError();
  const session = await sessionService.resolve(token);
  if (!session || !session.user.active) throw new UnauthenticatedError();
  c.set('user', session.user);
  c.set('sessionId', session.id);
  await next();
};
