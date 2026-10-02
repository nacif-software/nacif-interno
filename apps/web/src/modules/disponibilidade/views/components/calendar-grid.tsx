import { formatBusinessDays, type CalendarMonthDto } from '@nacif/shared';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';
import { paths } from '../../manifest';

export function CalendarGrid({ data }: { data: CalendarMonthDto }) {
  const n = data.days.length;
  const idx = (date: string) => Number(date.slice(8, 10)) - 1;
  const cols = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-card">
      <div className="min-w-[900px]">
        <div className="flex h-10 border-b border-line">
          <div className="w-[200px] shrink-0 border-r border-line" />
          <div className="grid flex-1" style={cols}>
            {data.days.map((d) => (
              <div
                key={d.date}
                className={cn(
                  'flex items-center justify-center border-r border-grid-line font-mono text-[11px] font-medium last:border-r-0',
                  d.weekend ? 'bg-canvas text-day-muted' : 'text-ink-muted',
                )}
              >
                {Number(d.date.slice(8, 10))}
              </div>
            ))}
          </div>
        </div>
        {data.rows.length === 0 && (
          <p className="p-6 text-[15px] text-ink-muted">Nenhuma pessoa ativa neste filtro.</p>
        )}
        {data.rows.map((row) => (
          <div key={row.user.id} className="flex h-[66px] border-b border-line last:border-b-0">
            <div className="flex w-[200px] shrink-0 flex-col justify-center gap-[2px] border-r border-line px-5">
              <span className="truncate text-[15px] font-semibold text-ink">{row.user.name}</span>
              <span className="truncate text-[13px] text-ink-muted">
                {row.project?.name ?? 'Sem projeto'}
                {row.isApprover && ' · aprovador'}
              </span>
            </div>
            <div className="relative grid flex-1" style={cols}>
              {data.days.map((d) => (
                <div
                  key={d.date}
                  aria-hidden
                  className={cn(
                    'border-r border-grid-line last:border-r-0',
                    d.weekend && 'bg-canvas',
                  )}
                />
              ))}
              {row.bars.map((bar) => {
                const start = idx(bar.clampedStart);
                const end = idx(bar.clampedEnd);
                const approved = bar.status === 'APPROVED';
                const width = end - start + 1;
                const label = approved
                  ? 'Aprovada'
                  : width >= 5
                    ? `Em análise · ${formatBusinessDays(bar.businessDays).replace(' úteis', '').replace(' útil', '')}`
                    : 'Em análise';
                return (
                  <Link
                    key={bar.communicationId}
                    to={paths.detail(bar.code)}
                    title={`${row.user.name}: ${label}`}
                    className={cn(
                      'absolute top-[19px] flex h-7 items-center overflow-hidden rounded-badge px-[10px] text-[12px] font-semibold whitespace-nowrap',
                      approved
                        ? 'bg-brand text-white hover:text-white'
                        : 'bg-hatched border border-brand text-brand hover:text-brand',
                    )}
                    style={{ left: `${(start / n) * 100}%`, width: `${(width / n) * 100}%` }}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
