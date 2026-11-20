import type { CreateHolidayBody } from '@nacif/shared';
import { param, type AppContext } from '../../../infra/http/context';
import { getInput } from '../../../infra/http/validate';
import { holidaysService } from './holidays.service';

export const holidaysController = {
  list: async (c: AppContext) => {
    return c.json(await holidaysService.list());
  },

  create: async (c: AppContext) => {
    const { body } = getInput<CreateHolidayBody>(c);
    return c.json(await holidaysService.create(body), 201);
  },

  remove: async (c: AppContext) => {
    await holidaysService.remove(param(c, 'id'));
    return c.body(null, 204);
  },
};
