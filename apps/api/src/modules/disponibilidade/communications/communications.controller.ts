import type {
  CommunicationsListQuery,
  ConflictsQuery,
  CreateCommunicationBody,
  UpdatePeriodBody,
} from '@nacif/shared';
import { param, type AppContext } from '../../../infra/http/context';
import { getInput } from '../../../infra/http/validate';
import { communicationsService } from './communications.service';

export const communicationsController = {
  listMine: async (c: AppContext) => {
    const { query } = getInput<unknown, CommunicationsListQuery>(c);
    return c.json(await communicationsService.listMine(c.get('user'), query));
  },

  conflicts: async (c: AppContext) => {
    const { query } = getInput<unknown, ConflictsQuery & { exclude?: string }>(c);
    return c.json(await communicationsService.conflicts(c.get('user'), query, query.exclude));
  },

  create: async (c: AppContext) => {
    const { body } = getInput<CreateCommunicationBody>(c);
    return c.json(await communicationsService.create(c.get('user'), body), 201);
  },

  get: async (c: AppContext) => {
    return c.json(await communicationsService.getDetail(c.get('user'), param(c, 'id')));
  },

  updatePeriod: async (c: AppContext) => {
    const { body } = getInput<UpdatePeriodBody>(c);
    return c.json(await communicationsService.updatePeriod(c.get('user'), param(c, 'id'), body));
  },

  cancel: async (c: AppContext) => {
    return c.json(await communicationsService.cancel(c.get('user'), param(c, 'id')));
  },
};
