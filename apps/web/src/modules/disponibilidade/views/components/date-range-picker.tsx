import {
  addMonths,
  compareIsoDates,
  countBusinessDays,
  daysInMonth,
  formatBusinessDays,
  formatDate,
  formatMonthTitle,
  isoDateMonth,
  isoDayOfWeek,
  monthStart,
  rangesOverlap,
  WEEKDAY_INITIALS,
  type ConflictDto,
  type IsoDate,
} from '@nacif/shared';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { MonthNav } from '@/ui';

export interface DateRangePickerProps {
  startDate?: IsoDate;
  endDate?: IsoDate;
  /** Primeiro dia selecionável (hoje). */
  minDate: IsoDate;
  conflicts?: ConflictDto[];
  onChange: (range: { startDate: IsoDate; endDate: IsoDate }) => void;
  label?: string;
  compact?: boolean;
}

type DayState = 'past' | 'normal' | 'sel' | 'edge' | 'conflict';

/** Seletor de período inline (tela 03). Clique define início; segundo clique define fim; clique antes do início reinicia. */
export function DateRangePicker({
  startDate,
  endDate,
  minDate,
  conflicts = [],
  onChange,
  label = 'Período de indisponibilidade',
  compact,
}: DateRangePickerProps) {
  const [month, setMonth] = useState(() => isoDateMonth(startDate ?? minDate));
  const total = daysInMonth(month);
  const leading = isoDayOfWeek(monthStart(month));

  function stateFor(day: IsoDate): DayState {
    if (compareIsoDates(day, minDate) < 0) return 'past';
    if (startDate && endDate) {
      if (day === startDate || day === endDate) return 'edge';
      if (day > startDate && day < endDate) return 'sel';
    } else if (startDate && day === startDate) {
      return 'edge';
    }
    if (conflicts.some((c) => rangesOverlap({ startDate: day, endDate: day }, c)))
      return 'conflict';
    return 'normal';
  }

  function pick(day: IsoDate) {
    if (compareIsoDates(day, minDate) < 0) return;
    if (!startDate || (startDate && endDate && startDate !== endDate) || day < startDate) {
      onChange({ startDate: day, endDate: day });
      return;
    }
    onChange({ startDate, endDate: day });
  }

  const businessDays = startDate && endDate ? countBusinessDays(startDate, endDate) : 0;
  const cell = compact ? 'h-[30px] text-[13px]' : 'h-[38px] text-[15px]';

  return (
    <div
      className={cn(
        'flex flex-col rounded-card border border-line bg-card',
        compact ? 'gap-4 p-[18px]' : 'gap-5 p-7',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={cn('font-semibold text-ink', compact ? 'text-[14px]' : 'text-[15px]')}>
          {label}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[14px] text-ink-muted" aria-live="polite">
            {formatMonthTitle(month)}
          </span>
          <MonthNav
            onPrev={() => setMonth((m) => addMonths(m, -1))}
            onNext={() => setMonth((m) => addMonths(m, 1))}
          />
        </div>
      </div>

      <div
        role="grid"
        aria-label={formatMonthTitle(month)}
        className={cn('grid grid-cols-7', compact ? 'gap-[3px]' : 'gap-1')}
      >
        {WEEKDAY_INITIALS.map((w, i) => (
          <div
            key={i}
            role="columnheader"
            className="py-[6px] text-center font-mono text-[11px] font-medium text-ink-muted"
          >
            {w}
          </div>
        ))}
        {Array.from({ length: leading }, (_, i) => (
          <div key={`empty-${i}`} aria-hidden />
        ))}
        {Array.from({ length: total }, (_, i) => {
          const day = `${month}-${String(i + 1).padStart(2, '0')}`;
          const state = stateFor(day);
          return (
            <button
              key={day}
              type="button"
              role="gridcell"
              aria-label={formatDate(day)}
              aria-selected={state === 'edge' || state === 'sel'}
              aria-disabled={state === 'past'}
              disabled={state === 'past'}
              onClick={() => pick(day)}
              className={cn(
                'flex items-center justify-center rounded-badge leading-none transition-colors',
                cell,
                state === 'past' && 'cursor-not-allowed text-day-muted',
                state === 'normal' && 'cursor-pointer text-ink-muted hover:bg-canvas',
                state === 'conflict' &&
                  'cursor-pointer bg-warning-bg text-warning hover:brightness-95',
                state === 'sel' && 'cursor-pointer bg-brand-wash font-semibold text-brand',
                state === 'edge' && 'cursor-pointer bg-brand font-semibold text-white',
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {compact ? (
        <div className="border-t border-line pt-[14px] text-[15px] font-semibold text-brand">
          {startDate && endDate
            ? `${formatDate(startDate).replace(/ \d{4}$/, '')} – ${formatDate(endDate).replace(/ \d{4}$/, '')} · ${formatBusinessDays(businessDays)}`
            : 'Selecione o período'}
        </div>
      ) : (
        <dl className="grid grid-cols-3 gap-6 border-t border-line pt-5">
          <div className="flex flex-col gap-2">
            <dt className="text-eyebrow">Início</dt>
            <dd className="text-[17px] font-semibold text-ink">
              {startDate ? formatDate(startDate) : '—'}
            </dd>
          </div>
          <div className="flex flex-col gap-2 border-l border-line pl-6">
            <dt className="text-eyebrow">Fim</dt>
            <dd className="text-[17px] font-semibold text-ink">
              {endDate ? formatDate(endDate) : '—'}
            </dd>
          </div>
          <div className="flex flex-col gap-2 border-l border-line pl-6">
            <dt className="text-eyebrow">Dias úteis no período</dt>
            <dd className="text-[17px] font-semibold text-brand">
              {startDate && endDate ? formatBusinessDays(businessDays) : '—'}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
