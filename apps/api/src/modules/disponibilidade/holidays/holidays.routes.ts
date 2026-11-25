import { createHolidayBodySchema } from '@nacif/shared';
import { createRouter, guard } from '../../../infra/http/context';
import { requireAuth } from '../../../infra/http/require-auth';
import { requireRole } from '../../../infra/http/require-role';
import { validate } from '../../../infra/http/validate';
import { holidaysController } from './holidays.controller';

export const holidaysRouter = createRouter();
guard(holidaysRouter, '/holidays', requireAuth);
holidaysRouter.get('/holidays', holidaysController.list);
holidaysRouter.post(
  '/holidays',
  requireRole('ADMIN'),
  validate({ body: createHolidayBodySchema }),
  holidaysController.create,
);
holidaysRouter.delete('/holidays/:id', requireRole('ADMIN'), holidaysController.remove);
