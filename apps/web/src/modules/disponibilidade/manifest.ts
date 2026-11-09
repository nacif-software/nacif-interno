import { PRODUCT_NAME, type Role } from '@nacif/shared';
import type { NavItem, WebModule } from '../registry';
import { disponibilidadeRoutes } from './routes';

export const BASE = '/disponibilidade';

export const paths = {
  base: BASE,
  list: `${BASE}/comunicacoes`,
  create: `${BASE}/comunicacoes/nova`,
  detail: (code: string) => `${BASE}/comunicacoes/${encodeURIComponent(code)}`,
  edit: (code: string) => `${BASE}/comunicacoes/${encodeURIComponent(code)}/editar`,
  approvals: `${BASE}/aprovacoes`,
  calendar: `${BASE}/calendario`,
  balance: `${BASE}/saldo`,
  balanceOf: (userId: string) => `${BASE}/saldo/${encodeURIComponent(userId)}`,
  admin: `${BASE}/administracao`,
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
