import { Router } from 'express';
import type { ApiModule } from '../../infra/http/module';
import { authRouter } from './auth/auth.routes';
import { healthRouter } from './health/health.routes';
import { projectsRouter } from './projects/projects.routes';
import { servicesRouter } from './services/services.routes';
import { usersRouter } from './users/users.routes';

const router = Router();
router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(projectsRouter);
router.use(servicesRouter);

export const coreModule: ApiModule = {
  slug: 'core',
  prefix: '',
  router,
};
