import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  dashed?: boolean;
  size?: 'md' | 'sm';
}

export function Chip({
  active,
  dashed,
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-2 rounded-badge leading-none whitespace-nowrap cursor-pointer transition-colors',
        size === 'md' ? 'text-[13px] px-[14px] py-[9px]' : 'text-[12px] px-3 py-2',
        active
          ? 'bg-ink text-white font-semibold'
          : dashed
            ? 'bg-transparent text-ink-muted font-medium border border-dashed border-line hover:border-ink-muted'
            : 'bg-white text-ink-muted font-medium border border-line hover:bg-canvas',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
