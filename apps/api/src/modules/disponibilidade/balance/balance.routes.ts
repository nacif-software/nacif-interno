import { createLedgerEntryBodySchema } from '@nacif/shared';
import { createRouter, guard } from '../../../infra/http/context';
import { requireAuth } from '../../../infra/http/require-auth';
import { requireRole } from '../../../infra/http/require-role';
import { validate } from '../../../infra/http/validate';
import { balanceController } from './balance.controller';

export const balanceRouter = createRouter();
guard(balanceRouter, '/balance', requireAuth);
balanceRouter.get('/balance', balanceController.mine);
balanceRouter.get('/balance/overview', requireRole('ADMIN'), balanceController.overview);
balanceRouter.post('/balance/accrual/run', requireRole('ADMIN'), balanceController.runAccrual);
balanceRouter.get('/balance/:userId', requireRole('ADMIN'), balanceController.ofUser);
balanceRouter.post(
  '/balance/:userId/entries',
  requireRole('ADMIN'),
  validate({ body: createLedgerEntryBodySchema }),
  balanceController.createEntry,
);
