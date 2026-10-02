import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function MetricCard({
  label,
  shortLabel,
  value,
  hint,
  size = 'lg',
  muted,
  className,
}: {
  label: string;
  /** Rótulo curto para o mobile (ex.: 'Dias no ano'). */
  shortLabel?: string;
  value: ReactNode;
  hint?: string;
  size?: 'lg' | 'md';
  muted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-[10px] rounded-card border border-line bg-card p-4 md:p-6',
        className,
      )}
    >
      <span className="text-eyebrow text-[11px] md:text-[12px]">
        <span className="md:hidden">{shortLabel ?? label}</span>
        <span className="max-md:hidden">{label}</span>
      </span>
      <span
        className={cn(
          'font-bold leading-none tracking-[-0.035em]',
          size === 'lg' ? 'text-[30px] md:text-[44px]' : 'text-[30px]',
          muted ? 'text-line' : 'text-ink',
        )}
      >
        {value}
      </span>
      {hint && <span className="hidden text-[14px] text-ink-muted md:block">{hint}</span>}
    </div>
  );
}
