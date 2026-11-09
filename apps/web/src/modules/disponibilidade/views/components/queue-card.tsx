import { formatBusinessDays, formatDateRange, type QueueItemDto, MESSAGES } from '@nacif/shared';
import { Link } from 'react-router';
import { Button, StatusBadge } from '@/ui';
import { paths } from '../../manifest';
import { BalanceAfter } from './balance-after';

export function QueueCard({
  item,
  onApprove,
  onReject,
  decidable,
  busy,
}: {
  item: QueueItemDto;
  onApprove: () => void;
  onReject: () => void;
  decidable: boolean;
  busy: boolean;
}) {
  return (
    <article className="flex flex-col gap-[14px] rounded-card border border-line bg-card p-[18px]">
      <Link
        to={paths.detail(item.code)}
        className="flex flex-col gap-1 text-inherit hover:text-inherit"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[16px] font-semibold text-ink">{item.author.name}</span>
          {!decidable && <StatusBadge status={item.status} size="sm" />}
        </div>
        <span className="text-[13px] text-ink-muted">
          {formatDateRange(item.startDate, item.endDate, { withYear: false })} ·{' '}
          {formatBusinessDays(item.businessDays)} ·{' '}
          {item.projects.map((p) => p.name).join(', ') || MESSAGES.noProject}
        </span>
        <span className="text-[13px] text-ink-muted">
          Cobertura: {item.cover?.name ?? MESSAGES.coverNotInformed}
        </span>
        {decidable && (
          <span className="text-[13px] text-ink-muted">
            Saldo:{' '}
            <BalanceAfter
              before={item.authorBalance}
              deducted={item.businessDays}
              className="text-[13px]"
            />
          </span>
        )}
      </Link>
      {decidable && (
        <div className="flex gap-2">
          <Button
            variant="accent"
            size="sm"
            className="flex-1 py-[13px] text-[14px]"
            loading={busy}
            onClick={onApprove}
          >
            Aprovar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1 py-[13px] text-[14px]"
            disabled={busy}
            onClick={onReject}
          >
            Recusar
          </Button>
        </div>
      )}
    </article>
  );
}
