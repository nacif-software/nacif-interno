import { Router } from 'express';
import type { ApiModule } from '../../infra/http/module';
import { approvalsRouter } from './approvals/approvals.routes';
import { calendarRouter } from './calendar/calendar.routes';
import { communicationsRouter } from './communications/communications.routes';
import { dashboardRouter } from './dashboard/dashboard.routes';
import { disponibilidadeService } from './manifest';
import { settingsRouter } from './settings/settings.routes';

const router = Router();
router.use(settingsRouter);
router.use(dashboardRouter);
router.use(communicationsRouter);
router.use(approvalsRouter);
router.use(calendarRouter);

export const disponibilidadeModule: ApiModule = {
  slug: 'disponibilidade',
  prefix: '/disponibilidade',
  router,
  service: disponibilidadeService,
};
