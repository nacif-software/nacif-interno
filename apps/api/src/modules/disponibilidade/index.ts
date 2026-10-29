import { createRouter } from '../../infra/http/context';
import type { ApiModule } from '../../infra/http/module';
import { approvalsRouter } from './approvals/approvals.routes';
import { calendarRouter } from './calendar/calendar.routes';
import { communicationsRouter } from './communications/communications.routes';
import { dashboardRouter } from './dashboard/dashboard.routes';
import { disponibilidadeService } from './manifest';
import { settingsRouter } from './settings/settings.routes';

const router = createRouter();
router.route('/', settingsRouter);
router.route('/', dashboardRouter);
router.route('/', communicationsRouter);
router.route('/', approvalsRouter);
router.route('/', calendarRouter);

export const disponibilidadeModule: ApiModule = {
  slug: 'disponibilidade',
  prefix: '/disponibilidade',
  router,
  service: disponibilidadeService,
};
