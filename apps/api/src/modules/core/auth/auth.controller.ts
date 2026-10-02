import type { LoginBody, SetPasswordBody } from '@nacif/shared';
import type { RequestHandler } from 'express';
import { getInput } from '../../../infra/http/validate';
import { toSessionUser } from '../users/user.mapper';
import { authService } from './auth.service';
import { sessionService } from './session.service';

export const authController = {
  login: (async (req, res) => {
    const { body } = getInput<LoginBody>(res);
    const user = await authService.login(body.email, body.password);
    await sessionService.end(req, res);
    await sessionService.start(res, user.id);
    res.status(200).json({ user });
  }) as RequestHandler,

  logout: (async (req, res) => {
    await sessionService.end(req, res);
    res.status(204).end();
  }) as RequestHandler,

  me: ((req, res) => {
    res.json({ user: toSessionUser(req.user) });
  }) as RequestHandler,

  setupInfo: (async (req, res) => {
    const info = await authService.getSetupInfo(String(req.params.token));
    res.json(info);
  }) as RequestHandler,

  setPassword: (async (req, res) => {
    const { body } = getInput<SetPasswordBody>(res);
    const user = await authService.setPassword(body);
    await sessionService.start(res, user.id);
    res.json({ user });
  }) as RequestHandler,
};
