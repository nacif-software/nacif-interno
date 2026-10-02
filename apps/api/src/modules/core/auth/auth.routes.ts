import { loginBodySchema, setPasswordBodySchema } from '@nacif/shared';
import { Router } from 'express';
import { requireAuth } from '../../../infra/http/require-auth';
import { validate } from '../../../infra/http/validate';
import { authController } from './auth.controller';

export const authRouter = Router();

authRouter.post('/auth/login', validate({ body: loginBodySchema }), authController.login);
authRouter.post('/auth/logout', authController.logout);
authRouter.get('/auth/me', requireAuth, authController.me);
authRouter.get('/auth/set-password/:token', authController.setupInfo);
authRouter.post(
  '/auth/set-password',
  validate({ body: setPasswordBodySchema }),
  authController.setPassword,
);
