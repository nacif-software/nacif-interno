import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';

export function MetricCard({
  label,
  shortLabel,
  value,
  hint,
  size = 'lg',
  muted,
  to,
  className,
}: {
  label: string;
  /** Torna o card um link (foco e hover visíveis no próprio card). */
  to?: string;
  /** Rótulo curto para o mobile (ex.: 'Dias no ano'). */
  shortLabel?: string;
  value: ReactNode;
  hint?: string;
  size?: 'lg' | 'md';
  muted?: boolean;
  className?: string;
}) {
  const className_ = cn(
    'flex flex-col gap-[10px] rounded-card border border-line bg-card p-4 md:p-6',
    to && 'text-inherit transition-colors hover:border-brand hover:text-inherit',
    className,
  );
  const content = (
    <>
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
    </>
  );
  if (to) {
    return (
      <Link to={to} className={className_}>
        {content}
      </Link>
    );
  }
  return <div className={className_}>{content}</div>;
}
