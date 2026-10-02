import {
  communicationsListQuerySchema,
  conflictsQuerySchema,
  createCommunicationBodySchema,
  updatePeriodBodySchema,
} from '@nacif/shared';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../../infra/http/require-auth';
import { validate } from '../../../infra/http/validate';
import { communicationsController } from './communications.controller';

export const communicationsRouter = Router();

communicationsRouter.use('/communications', requireAuth);
communicationsRouter.get(
  '/communications',
  validate({ query: communicationsListQuerySchema }),
  communicationsController.listMine,
);
communicationsRouter.get(
  '/communications/conflicts',
  validate({ query: conflictsQuerySchema.extend({ exclude: z.string().optional() }) }),
  communicationsController.conflicts,
);
communicationsRouter.post(
  '/communications',
  validate({ body: createCommunicationBodySchema }),
  communicationsController.create,
);
communicationsRouter.get('/communications/:id', communicationsController.get);
communicationsRouter.patch(
  '/communications/:id/period',
  validate({ body: updatePeriodBodySchema }),
  communicationsController.updatePeriod,
);
communicationsRouter.post('/communications/:id/cancel', communicationsController.cancel);
