import type { ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router';
import { findModuleByPath } from '@/modules/registry';
import { useCurrentUser } from '../../controllers/use-session';
import { MobileTabBar } from './mobile-tab-bar';
import { Topbar } from './topbar';

/** Layout padrão: topbar (68px), conteúdo e tab bar mobile. Itens de nav vêm do módulo da rota atual. */
export function AppShell({ children }: { children?: ReactNode }) {
  const user = useCurrentUser();
  const { pathname } = useLocation();
  const navItems = findModuleByPath(pathname)?.navItems?.(user.role) ?? [];
  return (
    <div className="flex min-h-dvh flex-col">
      <Topbar navItems={navItems} />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-5 py-5 pb-[calc(var(--spacing-tabbar)+24px)] md:px-10 md:py-9 md:pb-10">
        {children ?? <Outlet />}
      </main>
      <MobileTabBar navItems={navItems} />
    </div>
  );
}
