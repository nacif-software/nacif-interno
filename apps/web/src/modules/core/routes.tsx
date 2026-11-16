import type { RouteObject } from 'react-router';
import { LegacyRedirect } from './views/guards/legacy-redirect';
import { RequireAuth } from './views/guards/require-auth';
import { AppShell } from './views/layouts/app-shell';
import { HomePage } from './views/pages/home-page';
import { LoginPage } from './views/pages/login-page';
import { NotificationsPage } from './views/pages/notifications-page';
import { SetPasswordPage } from './views/pages/set-password-page';

export const coreRoutes: RouteObject[] = [
  { path: '/login', Component: LoginPage },
  { path: '/set-password/:token', Component: SetPasswordPage },
  // Rotas antigas (issue #46): links de senha já enviados continuam valendo.
  { path: '/definir-senha/:token', element: <LegacyRedirect to="/set-password/:token" /> },
  { path: '/notificacoes', element: <LegacyRedirect to="/notifications" /> },
  {
    Component: RequireAuth,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, Component: HomePage },
          { path: 'notifications', Component: NotificationsPage },
        ],
      },
    ],
  },
];
