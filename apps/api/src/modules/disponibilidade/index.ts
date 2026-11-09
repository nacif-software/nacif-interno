import { createRouter } from '../../infra/http/context';
import { onCreditBaseDateChanged } from '../core/users/user-hooks';
import type { ApiModule } from '../../infra/http/module';
import { approvalsRouter } from './approvals/approvals.routes';
import { accrualService } from './balance/accrual.service';
import { balanceRouter } from './balance/balance.routes';
import { calendarRouter } from './calendar/calendar.routes';
import { communicationsRouter } from './communications/communications.routes';
import { dashboardRouter } from './dashboard/dashboard.routes';
import { disponibilidadeService } from './manifest';
import { settingsRouter } from './settings/settings.routes';

// Data base do crédito alterada no core → créditos anuais pendentes entram na hora.
onCreditBaseDateChanged((userId) =>
  accrualService.runCatchUp(new Date(), userId).then(() => undefined),
);

const router = createRouter();
router.route('/', settingsRouter);
router.route('/', dashboardRouter);
router.route('/', communicationsRouter);
router.route('/', approvalsRouter);
router.route('/', calendarRouter);
router.route('/', balanceRouter);

export const disponibilidadeModule: ApiModule = {
  slug: 'disponibilidade',
  prefix: '/disponibilidade',
  router,
  service: disponibilidadeService,
};
