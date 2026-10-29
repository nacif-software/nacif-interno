import { createProjectBodySchema, updateProjectBodySchema } from '@nacif/shared';
import { createRouter, guard } from '../../../infra/http/context';
import { requireAuth } from '../../../infra/http/require-auth';
import { requireRole } from '../../../infra/http/require-role';
import { validate } from '../../../infra/http/validate';
import { projectsController } from './projects.controller';

export const projectsRouter = createRouter();

guard(projectsRouter, '/projects', requireAuth);
projectsRouter.get('/projects', projectsController.list);
projectsRouter.post(
  '/projects',
  requireRole('ADMIN'),
  validate({ body: createProjectBodySchema }),
  projectsController.create,
);
projectsRouter.patch(
  '/projects/:id',
  requireRole('ADMIN'),
  validate({ body: updateProjectBodySchema }),
  projectsController.update,
);
