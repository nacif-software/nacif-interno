import type { Role } from '@nacif/shared';
import type { RequestHandler } from 'express';
import { ForbiddenError } from './errors';

/** Deve vir depois de requireAuth. */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
}
