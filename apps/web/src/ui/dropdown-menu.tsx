import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function DropdownMenu({
  trigger,
  children,
  align = 'right',
  compact,
  closeOnSelect = true,
  role = 'menu',
  'aria-label': ariaLabel,
  className,
}: {
  trigger: (props: {
    open: boolean;
    'aria-expanded': boolean;
    'aria-controls': string;
    onClick: () => void;
  }) => ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  /** Menu estreito para colunas apertadas (ex.: projetos da pessoa). Use com `MenuItem compact`. */
  compact?: boolean;
  /** `false` para painéis de marcação (checkboxes) que ficam abertos até clicar fora ou Esc. */
  closeOnSelect?: boolean;
  /** Painel com checkboxes usa `group` em vez de `menu`. */
  role?: 'menu' | 'group';
  'aria-label'?: string;
  /** Classe do wrapper (ex.: `w-full` para o gatilho ocupar a célula). */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      {trigger({
        open,
        'aria-expanded': open,
        'aria-controls': id,
        onClick: () => setOpen((o) => !o),
      })}
      {open && (
        <div
          id={id}
          role={role}
          aria-label={ariaLabel}
          onClick={closeOnSelect ? () => setOpen(false) : undefined}
          className={cn(
            'absolute z-40 rounded-card border border-line bg-card shadow-float',
            compact
              ? 'top-[calc(100%+6px)] min-w-[150px] p-1'
              : 'top-[calc(100%+8px)] min-w-[220px] p-2',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  className,
  compact,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'block w-full rounded-badge text-left text-ink hover:bg-canvas cursor-pointer',
        compact ? 'px-[10px] py-[6px] text-[13px]' : 'px-3 py-2 text-[15px]',
        className,
      )}
    >
      {children}
    </button>
  );
}
