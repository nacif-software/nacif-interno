import { Router } from 'express';
import type { ApiModule } from '../../../infra/http/module';
import { requireAuth } from '../../../infra/http/require-auth';
import { buildServiceList } from './registry';

export const servicesRouter = Router();

servicesRouter.get('/services', requireAuth, (req, res) => {
  const registered = (req.app.locals.modules as readonly ApiModule[] | undefined) ?? [];
  res.json(buildServiceList(registered));
});
