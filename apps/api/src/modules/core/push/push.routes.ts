import { pushSubscriptionBodySchema, pushUnsubscribeBodySchema } from '@nacif/shared';
import { createRouter, guard } from '../../../infra/http/context';
import { requireAuth } from '../../../infra/http/require-auth';
import { validate } from '../../../infra/http/validate';
import { pushController } from './push.controller';

export const pushRouter = createRouter();

guard(pushRouter, '/push', requireAuth);
pushRouter.get('/push/config', pushController.config);
pushRouter.post(
  '/push/subscriptions',
  validate({ body: pushSubscriptionBodySchema }),
  pushController.subscribe,
);
pushRouter.delete(
  '/push/subscriptions',
  validate({ body: pushUnsubscribeBodySchema }),
  pushController.unsubscribe,
);
