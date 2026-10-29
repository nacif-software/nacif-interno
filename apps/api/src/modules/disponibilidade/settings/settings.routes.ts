import { updateSettingsBodySchema, type UpdateSettingsBody } from '@nacif/shared';
import { createRouter, type AppContext } from '../../../infra/http/context';
import { requireAuth } from '../../../infra/http/require-auth';
import { requireRole } from '../../../infra/http/require-role';
import { getInput, validate } from '../../../infra/http/validate';
import { settingsService } from './settings.service';

async function get(c: AppContext) {
  return c.json(await settingsService.get());
}
async function update(c: AppContext) {
  const { body } = getInput<UpdateSettingsBody>(c);
  return c.json(await settingsService.update(body));
}

export const settingsRouter = createRouter();
settingsRouter.get('/settings', requireAuth, get);
settingsRouter.put(
  '/settings',
  requireAuth,
  requireRole('ADMIN'),
  validate({ body: updateSettingsBodySchema }),
  update,
);
