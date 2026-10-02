import type {
  CommunicationsListQuery,
  ConflictsQuery,
  CreateCommunicationBody,
  UpdatePeriodBody,
} from '@nacif/shared';
import type { RequestHandler } from 'express';
import { getInput } from '../../../infra/http/validate';
import { communicationsService } from './communications.service';

export const communicationsController = {
  listMine: (async (req, res) => {
    const { query } = getInput<unknown, CommunicationsListQuery>(res);
    res.json(await communicationsService.listMine(req.user, query));
  }) as RequestHandler,

  conflicts: (async (req, res) => {
    const { query } = getInput<unknown, ConflictsQuery & { exclude?: string }>(res);
    res.json(await communicationsService.conflicts(req.user, query, query.exclude));
  }) as RequestHandler,

  create: (async (req, res) => {
    const { body } = getInput<CreateCommunicationBody>(res);
    res.status(201).json(await communicationsService.create(req.user, body));
  }) as RequestHandler,

  get: (async (req, res) => {
    res.json(await communicationsService.getDetail(req.user, String(req.params.id)));
  }) as RequestHandler,

  updatePeriod: (async (req, res) => {
    const { body } = getInput<UpdatePeriodBody>(res);
    res.json(await communicationsService.updatePeriod(req.user, String(req.params.id), body));
  }) as RequestHandler,

  cancel: (async (req, res) => {
    res.json(await communicationsService.cancel(req.user, String(req.params.id)));
  }) as RequestHandler,
};
