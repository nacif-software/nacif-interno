import type { InviteBody, UpdateUserBody, UserOptionsQuery, UsersListQuery } from '@nacif/shared';
import type { RequestHandler } from 'express';
import { getInput } from '../../../infra/http/validate';
import { invitesService } from './invites.service';
import { usersService } from './users.service';

export const usersController = {
  list: (async (req, res) => {
    const { query } = getInput<unknown, UsersListQuery>(res);
    res.json(await usersService.list(req.user, query));
  }) as RequestHandler,

  options: (async (req, res) => {
    const { query } = getInput<unknown, UserOptionsQuery>(res);
    res.json(await usersService.options(req.user, query.purpose));
  }) as RequestHandler,

  invite: (async (_req, res) => {
    const { body } = getInput<InviteBody>(res);
    res.status(201).json(await invitesService.invite(body));
  }) as RequestHandler,

  resendInvite: (async (req, res) => {
    res.json(await invitesService.resend(String(req.params.id)));
  }) as RequestHandler,

  resetPassword: (async (req, res) => {
    res.json(await invitesService.resetPassword(String(req.params.id), req.user));
  }) as RequestHandler,

  update: (async (req, res) => {
    const { body } = getInput<UpdateUserBody>(res);
    res.json(await usersService.update(req.user, String(req.params.id), body));
  }) as RequestHandler,
};
