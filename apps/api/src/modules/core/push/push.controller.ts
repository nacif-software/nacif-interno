import type { PushSubscriptionBody, PushUnsubscribeBody } from '@nacif/shared';
import type { AppContext } from '../../../infra/http/context';
import { getInput } from '../../../infra/http/validate';
import { pushService } from './push.service';

export const pushController = {
  config: (c: AppContext) => c.json(pushService.config()),
  subscribe: async (c: AppContext) => {
    const { body } = getInput<PushSubscriptionBody>(c);
    await pushService.subscribe(c.get('user'), body);
    return c.body(null, 201);
  },
  unsubscribe: async (c: AppContext) => {
    const { body } = getInput<PushUnsubscribeBody>(c);
    await pushService.unsubscribe(c.get('user'), body.endpoint);
    return c.body(null, 204);
  },
};
