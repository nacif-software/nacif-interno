import type { ApprovalsQuery, BatchApproveBody, RejectBody } from '@nacif/shared';
import type { RequestHandler } from 'express';
import { getInput } from '../../../infra/http/validate';
import { approvalsService } from './approvals.service';

export const approvalsController = {
  queue: (async (req, res) => {
    const { query } = getInput<unknown, ApprovalsQuery>(res);
    res.json(await approvalsService.queue(req.user, query));
  }) as RequestHandler,

  approve: (async (req, res) => {
    res.json(await approvalsService.approve(req.user, String(req.params.id)));
  }) as RequestHandler,

  reject: (async (req, res) => {
    const { body } = getInput<RejectBody>(res);
    res.json(await approvalsService.reject(req.user, String(req.params.id), body.justification));
  }) as RequestHandler,

  batch: (async (req, res) => {
    const { body } = getInput<BatchApproveBody>(res);
    res.json(await approvalsService.batchApprove(req.user, body.communicationIds));
  }) as RequestHandler,

  undo: (async (req, res) => {
    res.json(await approvalsService.undoBatch(req.user, String(req.params.batchId)));
  }) as RequestHandler,
};
