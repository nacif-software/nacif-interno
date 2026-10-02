import { cn } from '@/lib/cn';

export function LegendItem({
  variant,
  label,
}: {
  variant: 'approved' | 'in-review';
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-[14px] text-ink-muted">
      <span
        aria-hidden
        className={cn(
          'h-[10px] w-[22px] rounded-[2px]',
          variant === 'approved'
            ? 'bg-brand'
            : 'bg-hatched border border-brand bg-[length:8px_8px]',
        )}
      />
      {label}
    </span>
  );
}
