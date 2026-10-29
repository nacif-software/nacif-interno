import { calendarQuerySchema, type CalendarQuery } from '@nacif/shared';
import { createRouter, type AppContext } from '../../../infra/http/context';
import { requireAuth } from '../../../infra/http/require-auth';
import { getInput, validate } from '../../../infra/http/validate';
import { calendarService } from './calendar.service';

async function month(c: AppContext) {
  const { query } = getInput<unknown, CalendarQuery>(c);
  return c.json(await calendarService.month(query));
}

export const calendarRouter = createRouter();
calendarRouter.get('/calendar', requireAuth, validate({ query: calendarQuerySchema }), month);
