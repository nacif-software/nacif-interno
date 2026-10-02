import type { RouteObject } from 'react-router';
import { RequireAuth } from '@/modules/core/views/guards/require-auth';
import { RequireRole } from '@/modules/core/views/guards/require-role';
import { AppShell } from '@/modules/core/views/layouts/app-shell';
import { AdminPage } from './views/pages/admin-page';
import { ApprovalQueuePage } from './views/pages/approval-queue-page';
import { CommunicationDetailPage } from './views/pages/communication-detail-page';
import { CommunicationFormPage } from './views/pages/communication-form-page';
import { DashboardPage } from './views/pages/dashboard-page';
import { MyCommunicationsPage } from './views/pages/my-communications-page';
import { TeamCalendarPage } from './views/pages/team-calendar-page';

export const disponibilidadeRoutes: RouteObject[] = [
  {
    Component: RequireAuth,
    children: [
      {
        path: '/disponibilidade',
        element: <AppShell />,
        children: [
          { index: true, Component: DashboardPage },
          { path: 'comunicacoes', Component: MyCommunicationsPage },
          { path: 'comunicacoes/:code', Component: CommunicationDetailPage },
          { path: 'calendario', Component: TeamCalendarPage },
          {
            element: <RequireRole roles={['APPROVER', 'ADMIN']} />,
            children: [{ path: 'aprovacoes', Component: ApprovalQueuePage }],
          },
          {
            element: <RequireRole roles={['ADMIN']} />,
            children: [{ path: 'administracao', Component: AdminPage }],
          },
        ],
      },
      { path: '/disponibilidade/comunicacoes/nova', Component: CommunicationFormPage },
      { path: '/disponibilidade/comunicacoes/:code/editar', Component: CommunicationFormPage },
    ],
  },
];
