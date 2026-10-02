import { calendarQuerySchema, type CalendarQuery } from '@nacif/shared';
import { Router, type RequestHandler } from 'express';
import { requireAuth } from '../../../infra/http/require-auth';
import { getInput, validate } from '../../../infra/http/validate';
import { calendarService } from './calendar.service';

const month: RequestHandler = async (_req, res) => {
  const { query } = getInput<unknown, CalendarQuery>(res);
  res.json(await calendarService.month(query));
};

export const calendarRouter = Router();
calendarRouter.get('/calendar', requireAuth, validate({ query: calendarQuerySchema }), month);
