import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('h-4 animate-pulse rounded-check bg-neutral-bg', className)} />
  );
}

export function SkeletonCard({ label = 'Carregando' }: { label?: string }) {
  return (
    <div
      className="flex flex-col gap-3 rounded-card border border-line bg-card p-6"
      aria-busy="true"
      aria-label={label}
    >
      <span className="text-eyebrow">{label}</span>
      <Skeleton className="w-full" />
      <Skeleton className="w-[78%]" />
      <Skeleton className="w-[54%]" />
    </div>
  );
}
