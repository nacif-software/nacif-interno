import { PRODUCT_NAME, type Role } from '@nacif/shared';
import type { NavItem, WebModule } from '../registry';
import { disponibilidadeRoutes } from './routes';

export const BASE = '/disponibilidade';

export const paths = {
  base: BASE,
  list: `${BASE}/communications`,
  create: `${BASE}/communications/new`,
  detail: (code: string) => `${BASE}/communications/${encodeURIComponent(code)}`,
  edit: (code: string) => `${BASE}/communications/${encodeURIComponent(code)}/edit`,
  approvals: `${BASE}/approvals`,
  calendar: `${BASE}/calendar`,
  balance: `${BASE}/balance`,
  admin: `${BASE}/admin`,
};

function navItems(role: Role): NavItem[] {
  if (role === 'MEMBER') {
    return [
      { label: 'Início', to: paths.base, end: true },
      { label: 'Minhas comunicações', shortLabel: 'Comunicações', to: paths.list },
      { label: 'Saldo', to: paths.balance },
      { label: 'Time', to: paths.calendar },
    ];
  }
  const items: NavItem[] = [
    { label: 'Início', to: paths.base, end: true },
    { label: 'Aprovações', to: paths.approvals },
    { label: 'Calendário do time', shortLabel: 'Calendário', to: paths.calendar },
  ];
  if (role === 'ADMIN') items.push({ label: 'Administração', to: paths.admin });
  return items;
}

export const disponibilidadeModule: WebModule = {
  slug: 'disponibilidade',
  routes: disponibilidadeRoutes,
  service: {
    slug: 'disponibilidade',
    name: PRODUCT_NAME,
    description: 'Comunicação de períodos de indisponibilidade e aprovação.',
    path: BASE,
    status: 'available',
  },
  navItems,
};
