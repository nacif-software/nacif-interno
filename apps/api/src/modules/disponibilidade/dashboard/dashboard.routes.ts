import { createRouter, type AppContext } from '../../../infra/http/context';
import { requireAuth } from '../../../infra/http/require-auth';
import { dashboardService } from './dashboard.service';

async function get(c: AppContext) {
  return c.json(await dashboardService.get(c.get('user')));
}

export const dashboardRouter = createRouter();
dashboardRouter.get('/dashboard', requireAuth, get);
