import { MESSAGES } from '@nacif/shared';
import { cn } from '@/lib/cn';

/** `17 → 12`: saldo do autor hoje e depois de aprovar; o segundo número em vermelho quando negativo. */
export function BalanceAfter({
  before,
  deducted,
  className,
}: {
  before: number;
  deducted: number;
  className?: string;
}) {
  const after = before - deducted;
  return (
    <span
      className={cn('font-mono text-[14px] text-ink-muted', className)}
      aria-label={MESSAGES.balanceAfterApproval(before, after)}
      title={MESSAGES.balanceTitle}
    >
      {before} → <span className={cn(after < 0 && 'font-semibold text-danger')}>{after}</span>
    </span>
  );
}
