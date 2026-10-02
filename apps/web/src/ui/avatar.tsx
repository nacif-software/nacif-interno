import { cn } from '@/lib/cn';

export function Avatar({
  initials,
  name,
  size = 34,
  className,
}: {
  initials: string;
  name?: string;
  size?: 34 | 30;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={name ?? initials}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand-wash font-semibold text-brand select-none',
        size === 34 ? 'size-[34px] text-[13px]' : 'size-[30px] text-[12px]',
        className,
      )}
    >
      {initials}
    </span>
  );
}
