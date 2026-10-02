import { addMonths, APP_TIMEZONE, formatMonthRange, isoDateMonth, todayIso } from '@nacif/shared';
import { Chip, DropdownMenu, MenuItem } from '@/ui';

export interface PeriodPreset {
  key: string;
  label: string;
  from?: string;
  to?: string;
}

export function periodPresets(): PeriodPreset[] {
  const current = isoDateMonth(todayIso(APP_TIMEZONE));
  return [
    { key: 'next2', label: 'Este e próximo mês', from: current, to: addMonths(current, 1) },
    { key: 'current', label: 'Este mês', from: current, to: current },
    { key: 'next3', label: 'Próximos 3 meses', from: current, to: addMonths(current, 2) },
    { key: 'all', label: 'Todos os períodos' },
  ];
}

export function PeriodFilter({
  value,
  onChange,
}: {
  value: PeriodPreset;
  onChange: (p: PeriodPreset) => void;
}) {
  const presets = periodPresets();
  const label =
    value.from && value.to ? formatMonthRange(value.from, value.to) : 'Todos os períodos';
  return (
    <DropdownMenu
      trigger={({ open: _open, ...props }) => (
        <Chip {...props} aria-haspopup="menu" className="max-md:hidden">
          {label}
          <span
            aria-hidden
            className="border-x-4 border-t-[5px] border-x-transparent border-t-current opacity-70"
          />
        </Chip>
      )}
    >
      {presets.map((p) => (
        <MenuItem
          key={p.key}
          onClick={() => onChange(p)}
          className={p.key === value.key ? 'font-semibold' : undefined}
        >
          {p.label}
        </MenuItem>
      ))}
    </DropdownMenu>
  );
}
