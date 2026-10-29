import type { InviteBody, UpdateUserBody, UserOptionsQuery, UsersListQuery } from '@nacif/shared';
import { param, type AppContext } from '../../../infra/http/context';
import { getInput } from '../../../infra/http/validate';
import { invitesService } from './invites.service';
import { usersService } from './users.service';

export const usersController = {
  list: async (c: AppContext) => {
    const { query } = getInput<unknown, UsersListQuery>(c);
    return c.json(await usersService.list(c.get('user'), query));
  },

  options: async (c: AppContext) => {
    const { query } = getInput<unknown, UserOptionsQuery>(c);
    return c.json(await usersService.options(c.get('user'), query.purpose));
  },

  invite: async (c: AppContext) => {
    const { body } = getInput<InviteBody>(c);
    return c.json(await invitesService.invite(body), 201);
  },

  resendInvite: async (c: AppContext) => {
    return c.json(await invitesService.resend(param(c, 'id')));
  },

  resetPassword: async (c: AppContext) => {
    return c.json(await invitesService.resetPassword(param(c, 'id'), c.get('user')));
  },

  update: async (c: AppContext) => {
    const { body } = getInput<UpdateUserBody>(c);
    return c.json(await usersService.update(c.get('user'), param(c, 'id'), body));
  },
};
