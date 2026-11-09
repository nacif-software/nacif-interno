import { createLedgerEntryBodySchema, type CreateLedgerEntryBody } from '@nacif/shared';
import { createRouter, guard, param, type AppContext } from '../../../infra/http/context';
import { requireAuth } from '../../../infra/http/require-auth';
import { requireRole } from '../../../infra/http/require-role';
import { getInput, validate } from '../../../infra/http/validate';
import { accrualService } from './accrual.service';
import { balanceService } from './balance.service';

async function mine(c: AppContext) {
  return c.json(await balanceService.statement(c.get('user').id));
}
async function overview(c: AppContext) {
  return c.json(await balanceService.overview());
}
async function ofUser(c: AppContext) {
  return c.json(await balanceService.statement(param(c, 'userId')));
}
async function createEntry(c: AppContext) {
  const { body } = getInput<CreateLedgerEntryBody>(c);
  return c.json(await balanceService.createEntry(c.get('user'), param(c, 'userId'), body), 201);
}
async function runAccrual(c: AppContext) {
  return c.json(await accrualService.runCatchUp());
}

export const balanceRouter = createRouter();
guard(balanceRouter, '/balance', requireAuth);
balanceRouter.get('/balance', mine);
balanceRouter.get('/balance/overview', requireRole('ADMIN'), overview);
balanceRouter.post('/balance/accrual/run', requireRole('ADMIN'), runAccrual);
balanceRouter.get('/balance/:userId', requireRole('ADMIN'), ofUser);
balanceRouter.post(
  '/balance/:userId/entries',
  requireRole('ADMIN'),
  validate({ body: createLedgerEntryBodySchema }),
  createEntry,
);
