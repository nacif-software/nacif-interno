import { formatDateRange, formatSentDate, type QueueItemDto } from '@nacif/shared';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';
import { Button, Checkbox, StatusBadge } from '@/ui';
import { paths } from '../../manifest';

const GRID = 'grid-cols-[44px_1.4fr_1.3fr_80px_1.1fr_1fr_110px_190px]';

export function QueueTable({
  items,
  selected,
  onToggle,
  onToggleAll,
  onApprove,
  onReject,
  decidable,
  busyId,
}: {
  items: QueueItemDto[];
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onToggleAll: (on: boolean) => void;
  onApprove: (item: QueueItemDto) => void;
  onReject: (item: QueueItemDto) => void;
  decidable: boolean;
  busyId: string | null;
}) {
  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  return (
    <div className="hidden overflow-hidden rounded-card border border-line bg-card md:block">
      <div className={cn('grid h-12 items-center gap-4 border-b border-line bg-canvas px-5', GRID)}>
        <Checkbox
          aria-label="Selecionar todas"
          checked={allSelected}
          disabled={!decidable}
          onChange={(e) => onToggleAll(e.target.checked)}
          className="border-ink-muted"
        />
        {['Pessoa', 'Período', 'Dias', 'Cobertura', 'Enviada em', 'Status'].map((h) => (
          <span key={h} className="text-eyebrow">
            {h}
          </span>
        ))}
        <span />
      </div>
      <ul>
        {items.map((item) => {
          const isSelected = selected.has(item.id);
          return (
            <li
              key={item.id}
              className={cn(
                'grid h-[70px] items-center gap-4 border-b border-line px-5 last:border-b-0',
                GRID,
                isSelected && 'bg-row-selected',
              )}
            >
              <Checkbox
                aria-label={`Selecionar ${item.author.name}`}
                checked={isSelected}
                disabled={!decidable}
                onChange={() => onToggle(item.id)}
              />
              <Link
                to={paths.detail(item.code)}
                className="flex min-w-0 flex-col text-inherit hover:text-inherit"
              >
                <span className="truncate text-[15px] font-semibold text-ink">
                  {item.author.name}
                </span>
                <span className="text-[13px] text-ink-muted">{item.project.name}</span>
              </Link>
              <span className="text-[15px] text-ink">
                {formatDateRange(item.startDate, item.endDate)}
              </span>
              <span className="font-mono text-[15px] font-medium text-ink">
                {item.businessDays}
              </span>
              <span className="truncate text-[15px] text-ink-muted">{item.cover.name}</span>
              <span className="font-mono text-[14px] text-ink-muted">
                {formatSentDate(item.submittedAt)}
              </span>
              <StatusBadge status={item.status} />
              <div className="flex justify-end gap-2">
                {decidable && (
                  <>
                    <Button
                      variant="accent"
                      size="sm"
                      loading={busyId === item.id}
                      onClick={() => onApprove(item)}
                    >
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={busyId === item.id}
                      onClick={() => onReject(item)}
                    >
                      Recusar
                    </Button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
