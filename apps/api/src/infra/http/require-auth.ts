import type { RequestHandler } from 'express';
import type { Project, User } from '../../generated/prisma/client';
import { sessionService } from '../../modules/core/auth/session.service';
import { UnauthenticatedError } from './errors';

export type AuthenticatedUser = User & { project: Project | null };

declare module 'express-serve-static-core' {
  interface Request {
    user: AuthenticatedUser;
    sessionId: string;
  }
}

/** Carrega a sessão do cookie e popula req.user. 401 se ausente, expirada ou usuário inativo. */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = sessionService.readToken(req);
  if (!token) {
    next(new UnauthenticatedError());
    return;
  }
  const session = await sessionService.resolve(token);
  if (!session || !session.user.active) {
    next(new UnauthenticatedError());
    return;
  }
  req.user = session.user;
  req.sessionId = session.id;
  next();
};
