import { STATUS_LABEL_PLURAL, type CommunicationStatus } from '@nacif/shared';
import { Chip } from '@/ui';

const LABELS: Record<string, string> = { ALL: 'Todas', ...STATUS_LABEL_PLURAL };

export function StatusFilterChips<T extends CommunicationStatus | 'ALL'>({
  options,
  value,
  onChange,
  counts,
  size,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  counts?: Partial<Record<T, number>>;
  size?: 'md' | 'sm';
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 md:gap-[10px]"
      role="group"
      aria-label="Filtrar por status"
    >
      {options.map((opt) => (
        <Chip key={opt} active={opt === value} size={size} onClick={() => onChange(opt)}>
          {LABELS[opt]}
          {counts?.[opt] !== undefined && <span className="opacity-70">{counts[opt]}</span>}
        </Chip>
      ))}
    </div>
  );
}
