import type { ApprovalsQuery, BatchApproveBody, RejectBody } from '@nacif/shared';
import { param, type AppContext } from '../../../infra/http/context';
import { getInput } from '../../../infra/http/validate';
import { approvalsService } from './approvals.service';

export const approvalsController = {
  queue: async (c: AppContext) => {
    const { query } = getInput<unknown, ApprovalsQuery>(c);
    return c.json(await approvalsService.queue(c.get('user'), query));
  },

  approve: async (c: AppContext) => {
    return c.json(await approvalsService.approve(c.get('user'), param(c, 'id')));
  },

  reject: async (c: AppContext) => {
    const { body } = getInput<RejectBody>(c);
    return c.json(await approvalsService.reject(c.get('user'), param(c, 'id'), body.justification));
  },

  batch: async (c: AppContext) => {
    const { body } = getInput<BatchApproveBody>(c);
    return c.json(await approvalsService.batchApprove(c.get('user'), body.communicationIds));
  },

  undo: async (c: AppContext) => {
    return c.json(await approvalsService.undoBatch(c.get('user'), param(c, 'batchId')));
  },
};
