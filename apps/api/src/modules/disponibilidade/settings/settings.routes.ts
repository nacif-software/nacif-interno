import { updateSettingsBodySchema, type UpdateSettingsBody } from '@nacif/shared';
import { Router, type RequestHandler } from 'express';
import { requireAuth } from '../../../infra/http/require-auth';
import { requireRole } from '../../../infra/http/require-role';
import { getInput, validate } from '../../../infra/http/validate';
import { settingsService } from './settings.service';

const get: RequestHandler = async (_req, res) => {
  res.json(await settingsService.get());
};
const update: RequestHandler = async (_req, res) => {
  const { body } = getInput<UpdateSettingsBody>(res);
  res.json(await settingsService.update(body));
};

export const settingsRouter = Router();
settingsRouter.get('/settings', requireAuth, get);
settingsRouter.put(
  '/settings',
  requireAuth,
  requireRole('ADMIN'),
  validate({ body: updateSettingsBodySchema }),
  update,
);
