import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function EmptyState({
  eyebrow,
  title,
  body,
  action,
  centered,
  className,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  action?: ReactNode;
  centered?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-card',
        centered ? 'flex flex-1 items-center justify-center p-10' : 'p-8',
        className,
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-[14px]',
          centered && 'max-w-[460px] items-center gap-[18px] text-center',
        )}
      >
        {centered && <span aria-hidden className="size-14 rounded-card bg-brand-wash" />}
        {eyebrow && <span className="text-eyebrow">{eyebrow}</span>}
        <h3
          className={
            centered
              ? 'text-section-title'
              : 'text-[22px] font-bold leading-[1.2] tracking-[-0.02em] text-ink'
          }
        >
          {title}
        </h3>
        <p
          className={cn(
            'text-ink-muted',
            centered ? 'text-[16px] leading-[1.55]' : 'text-[15px] leading-[1.55]',
          )}
        >
          {body}
        </p>
        {action}
      </div>
    </div>
  );
}
