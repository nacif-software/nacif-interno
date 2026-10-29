import { createRouter } from '../../infra/http/context';
import type { ApiModule } from '../../infra/http/module';
import { authRouter } from './auth/auth.routes';
import { healthRouter } from './health/health.routes';
import { projectsRouter } from './projects/projects.routes';
import { servicesRouter } from './services/services.routes';
import { usersRouter } from './users/users.routes';

const router = createRouter();
router.route('/', healthRouter);
router.route('/', authRouter);
router.route('/', usersRouter);
router.route('/', projectsRouter);
router.route('/', servicesRouter);

export const coreModule: ApiModule = {
  slug: 'core',
  prefix: '',
  router,
};
