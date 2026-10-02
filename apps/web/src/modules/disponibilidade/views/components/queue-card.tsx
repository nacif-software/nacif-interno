import { formatBusinessDays, formatDateRange, type QueueItemDto } from '@nacif/shared';
import { Link } from 'react-router';
import { Button, StatusBadge } from '@/ui';
import { paths } from '../../manifest';

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
          {formatBusinessDays(item.businessDays)} · {item.project.name}
        </span>
        <span className="text-[13px] text-ink-muted">Cobertura: {item.cover.name}</span>
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
