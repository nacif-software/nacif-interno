import type { WebModule } from '../registry';
import { coreRoutes } from './routes';

export const coreModule: WebModule = {
  slug: 'core',
  routes: coreRoutes,
};
