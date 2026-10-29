import { createRouter } from '../../../infra/http/context';
import { requireAuth } from '../../../infra/http/require-auth';
import { buildServiceList } from './registry';

export const servicesRouter = createRouter();

servicesRouter.get('/services', requireAuth, (c) => {
  return c.json(buildServiceList(c.get('modules')));
});
