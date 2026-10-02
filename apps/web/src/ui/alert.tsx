import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Alert({
  variant,
  title,
  children,
  compact,
  className,
}: {
  variant: 'error' | 'warning';
  title?: ReactNode;
  children: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  const tone = variant === 'error' ? 'border-danger bg-danger-bg' : 'border-warning bg-warning-bg';
  const dot = variant === 'error' ? 'bg-danger' : 'bg-warning';
  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-control border',
        compact ? 'p-[14px] text-[13px] leading-[1.5]' : 'px-[18px] py-4',
        tone,
        className,
      )}
    >
      {!compact && (
        <span aria-hidden className={cn('mt-[7px] size-2 shrink-0 rounded-full', dot)} />
      )}
      <div className="flex flex-col gap-1">
        {title && (
          <p
            className={cn(
              'font-semibold text-ink',
              compact ? 'inline' : 'text-[14px] leading-[1.4]',
            )}
          >
            {title}
          </p>
        )}
        <div className={cn('text-ink-muted', compact ? 'inline' : 'text-[14px] leading-[1.55]')}>
          {children}
        </div>
      </div>
    </div>
  );
}
