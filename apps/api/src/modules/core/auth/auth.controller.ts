import type { LoginBody, SetPasswordBody } from '@nacif/shared';
import { param, type AppContext } from '../../../infra/http/context';
import { getInput } from '../../../infra/http/validate';
import { toSessionUser } from '../users/user.mapper';
import { authService } from './auth.service';
import { sessionService } from './session.service';

export const authController = {
  login: async (c: AppContext) => {
    const { body } = getInput<LoginBody>(c);
    const user = await authService.login(body.email, body.password);
    await sessionService.revokeCurrent(c);
    await sessionService.start(c, user.id);
    return c.json({ user }, 200);
  },

  logout: async (c: AppContext) => {
    await sessionService.end(c);
    return c.body(null, 204);
  },

  me: (c: AppContext) => {
    return c.json({ user: toSessionUser(c.get('user')) });
  },

  setupInfo: async (c: AppContext) => {
    const info = await authService.getSetupInfo(param(c, 'token'));
    return c.json(info);
  },

  setPassword: async (c: AppContext) => {
    const { body } = getInput<SetPasswordBody>(c);
    const user = await authService.setPassword(body);
    await sessionService.start(c, user.id);
    return c.json({ user });
  },
};
