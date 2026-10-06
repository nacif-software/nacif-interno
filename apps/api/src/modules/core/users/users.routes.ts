import {
  inviteBodySchema,
  updateUserBodySchema,
  userOptionsQuerySchema,
  usersListQuerySchema,
} from '@nacif/shared';
import { Router } from 'express';
import { requireAuth } from '../../../infra/http/require-auth';
import { requireRole } from '../../../infra/http/require-role';
import { validate } from '../../../infra/http/validate';
import { usersController } from './users.controller';

export const usersRouter = Router();

usersRouter.use('/users', requireAuth);
usersRouter.get('/users', validate({ query: usersListQuerySchema }), usersController.list);
usersRouter.get(
  '/users/options',
  validate({ query: userOptionsQuerySchema }),
  usersController.options,
);
usersRouter.post(
  '/users/invites',
  requireRole('ADMIN'),
  validate({ body: inviteBodySchema }),
  usersController.invite,
);
usersRouter.post('/users/:id/invites/resend', requireRole('ADMIN'), usersController.resendInvite);
usersRouter.post('/users/:id/password-reset', requireRole('ADMIN'), usersController.resetPassword);
usersRouter.patch(
  '/users/:id',
  requireRole('ADMIN'),
  validate({ body: updateUserBodySchema }),
  usersController.update,
);
