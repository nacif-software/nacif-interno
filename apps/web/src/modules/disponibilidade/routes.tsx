import type { RouteObject } from 'react-router';
import { LegacyRedirect } from '@/modules/core/views/guards/legacy-redirect';
import { RequireAuth } from '@/modules/core/views/guards/require-auth';
import { RequireRole } from '@/modules/core/views/guards/require-role';
import { AppShell } from '@/modules/core/views/layouts/app-shell';
import { AdminPage } from './views/pages/admin-page';
import { ApprovalQueuePage } from './views/pages/approval-queue-page';
import { BalancePage } from './views/pages/balance-page';
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
          { path: 'communications', Component: MyCommunicationsPage },
          { path: 'communications/:code', Component: CommunicationDetailPage },
          { path: 'calendar', Component: TeamCalendarPage },
          { path: 'balance', Component: BalancePage },
          {
            element: <RequireRole roles={['APPROVER', 'ADMIN']} />,
            children: [{ path: 'approvals', Component: ApprovalQueuePage }],
          },
          {
            element: <RequireRole roles={['ADMIN']} />,
            children: [
              { path: 'admin', Component: AdminPage },
              { path: 'balance/:userId', Component: BalancePage },
            ],
          },
        ],
      },
      { path: '/disponibilidade/communications/new', Component: CommunicationFormPage },
      { path: '/disponibilidade/communications/:code/edit', Component: CommunicationFormPage },
    ],
  },
  // Rotas antigas (issue #46): fora do RequireAuth para o `?next=` do login já apontar para a nova.
  ...legacyRoutes({
    '/disponibilidade/comunicacoes': '/disponibilidade/communications',
    '/disponibilidade/comunicacoes/nova': '/disponibilidade/communications/new',
    '/disponibilidade/comunicacoes/:code': '/disponibilidade/communications/:code',
    '/disponibilidade/comunicacoes/:code/editar': '/disponibilidade/communications/:code/edit',
    '/disponibilidade/aprovacoes': '/disponibilidade/approvals',
    '/disponibilidade/calendario': '/disponibilidade/calendar',
    '/disponibilidade/saldo': '/disponibilidade/balance',
    '/disponibilidade/saldo/:userId': '/disponibilidade/balance/:userId',
    '/disponibilidade/administracao': '/disponibilidade/admin',
  }),
];

function legacyRoutes(map: Record<string, string>): RouteObject[] {
  return Object.entries(map).map(([path, to]) => ({ path, element: <LegacyRedirect to={to} /> }));
}
