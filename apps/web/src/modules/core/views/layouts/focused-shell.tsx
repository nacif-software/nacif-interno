import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Breadcrumb, Logo, type Crumb } from '@/ui';

/** Layout de tarefa (formulário): logo + breadcrumb, coluna central e rodapé fixo com ações. */
export function FocusedShell({
  crumbs,
  backTo,
  title,
  children,
  footer,
}: {
  crumbs: Crumb[];
  backTo?: string;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-card">
        <div className="mx-auto flex h-topbar-mobile max-w-[1440px] items-center gap-6 px-5 md:h-topbar md:px-10">
          <div className="hidden items-center gap-6 md:flex">
            <Logo size="md" />
            <Breadcrumb items={crumbs} />
          </div>
          <div className="flex items-center gap-3 md:hidden">
            {backTo && (
              <Link
                to={backTo}
                aria-label="Voltar"
                className="text-[18px] font-medium text-ink-muted"
              >
                ‹
              </Link>
            )}
            <span className="text-[16px] font-semibold text-ink">
              {title ?? crumbs.at(-1)?.label}
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-4 pb-40 md:px-10 md:py-11">
        <div className="mx-auto flex max-w-[720px] flex-col gap-4 md:gap-7">{children}</div>
      </main>
      {footer && (
        <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card px-5 py-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] md:px-10 md:py-5">
          <div className="mx-auto max-w-[1440px]">{footer}</div>
        </footer>
      )}
    </div>
  );
}
