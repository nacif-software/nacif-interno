import { NavLink } from 'react-router';
import { cn } from '@/lib/cn';
import type { NavItem } from '@/modules/registry';
import { Logo } from '@/ui';
import { UserMenu } from './user-menu';

export function Topbar({ navItems }: { navItems: NavItem[] }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card">
      <div className="mx-auto flex h-topbar-mobile max-w-[1440px] items-center justify-between px-5 md:h-topbar md:px-10">
        <div className="flex items-center gap-11">
          <Logo size="md" />
          {navItems.length > 0 && (
            <nav aria-label="Principal" className="hidden items-center gap-7 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'border-b-2 pt-6 pb-[22px] text-[15px] leading-none transition-colors',
                      isActive
                        ? 'border-brand font-semibold text-ink'
                        : 'border-transparent font-normal text-ink-muted hover:text-ink',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
