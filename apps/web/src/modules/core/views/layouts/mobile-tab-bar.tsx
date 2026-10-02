import { NavLink } from 'react-router';
import { cn } from '@/lib/cn';
import type { NavItem } from '@/modules/registry';

export function MobileTabBar({ navItems }: { navItems: NavItem[] }) {
  if (navItems.length === 0) return null;
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 flex h-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom,0px))] items-start justify-around border-t border-line bg-card pt-[22px] pb-[env(safe-area-inset-bottom,0px)] md:hidden"
    >
      {navItems.slice(0, 3).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn('text-[13px] leading-none', isActive ? 'font-semibold text-brand' : 'text-ink-muted')
          }
        >
          {item.shortLabel ?? item.label}
        </NavLink>
      ))}
    </nav>
  );
}
