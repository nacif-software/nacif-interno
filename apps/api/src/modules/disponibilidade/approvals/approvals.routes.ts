import {
  approvalsQuerySchema,
  approveBodySchema,
  batchApproveBodySchema,
  rejectBodySchema,
} from '@nacif/shared';
import { createRouter, guard } from '../../../infra/http/context';
import { requireAuth } from '../../../infra/http/require-auth';
import { requireRole } from '../../../infra/http/require-role';
import { validate } from '../../../infra/http/validate';
import { approvalsController } from './approvals.controller';

export const approvalsRouter = createRouter();

guard(approvalsRouter, '/approvals', requireAuth, requireRole('APPROVER', 'ADMIN'));
approvalsRouter.get(
  '/approvals',
  validate({ query: approvalsQuerySchema }),
  approvalsController.queue,
);
approvalsRouter.post(
  '/approvals/batch',
  validate({ body: batchApproveBodySchema }),
  approvalsController.batch,
);
approvalsRouter.post('/approvals/batch/:batchId/undo', approvalsController.undo);
// Corpo opcional: `{}` aprova com os dias úteis; `deductedDays` + `deductionNote` ajustam o desconto.
approvalsRouter.post(
  '/approvals/:id/approve',
  validate({ body: approveBodySchema }),
  approvalsController.approve,
);
approvalsRouter.post(
  '/approvals/:id/reject',
  validate({ body: rejectBodySchema }),
  approvalsController.reject,
);
