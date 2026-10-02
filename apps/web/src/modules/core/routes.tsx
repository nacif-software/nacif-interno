import type { RouteObject } from 'react-router';
import { RequireAuth } from './views/guards/require-auth';
import { AppShell } from './views/layouts/app-shell';
import { HomePage } from './views/pages/home-page';
import { LoginPage } from './views/pages/login-page';
import { SetPasswordPage } from './views/pages/set-password-page';

export const coreRoutes: RouteObject[] = [
  { path: '/login', Component: LoginPage },
  { path: '/definir-senha/:token', Component: SetPasswordPage },
  {
    Component: RequireAuth,
    children: [
      { path: '/', element: <AppShell />, children: [{ index: true, Component: HomePage }] },
    ],
  },
];
