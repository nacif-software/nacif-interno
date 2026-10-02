import { createBrowserRouter } from 'react-router';
import { NotFoundPage } from './modules/core/views/pages/not-found-page';
import { webModules } from './modules/registry';

export const router = createBrowserRouter([
  ...webModules.flatMap((m) => m.routes),
  { path: '*', Component: NotFoundPage },
]);
