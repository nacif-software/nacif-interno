import type { CreateProjectBody, UpdateProjectBody } from '@nacif/shared';
import { param, type AppContext } from '../../../infra/http/context';
import { getInput } from '../../../infra/http/validate';
import { projectsService } from './projects.service';

export const projectsController = {
  list: async (c: AppContext) => {
    return c.json(await projectsService.list());
  },
  create: async (c: AppContext) => {
    const { body } = getInput<CreateProjectBody>(c);
    return c.json(await projectsService.create(body), 201);
  },
  update: async (c: AppContext) => {
    const { body } = getInput<UpdateProjectBody>(c);
    return c.json(await projectsService.update(param(c, 'id'), body));
  },
};
