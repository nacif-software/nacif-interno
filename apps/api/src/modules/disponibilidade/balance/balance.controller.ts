import type { CreateLedgerEntryBody } from '@nacif/shared';
import { param, type AppContext } from '../../../infra/http/context';
import { getInput } from '../../../infra/http/validate';
import { accrualService } from './accrual.service';
import { balanceService } from './balance.service';

export const balanceController = {
  mine: async (c: AppContext) => {
    return c.json(await balanceService.statement(c.get('user').id));
  },

  overview: async (c: AppContext) => {
    return c.json(await balanceService.overview());
  },

  ofUser: async (c: AppContext) => {
    return c.json(await balanceService.statement(param(c, 'userId')));
  },

  createEntry: async (c: AppContext) => {
    const { body } = getInput<CreateLedgerEntryBody>(c);
    return c.json(await balanceService.createEntry(c.get('user'), param(c, 'userId'), body), 201);
  },

  runAccrual: async (c: AppContext) => {
    return c.json(await accrualService.runCatchUp());
  },
};
