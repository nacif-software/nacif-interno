import { MESSAGES, type ProjectRef } from '@nacif/shared';
import { cn } from '@/lib/cn';
import { Select } from '@/ui';

/**
 * Projetos de uma pessoa numa coluna estreita: lista vertical (nome + remover à direita) e um
 * select para adicionar entre os projetos restantes.
 */
export function ProjectPicker({
  label,
  selected,
  options,
  onChange,
  disabled,
  className,
}: {
  label: string;
  selected: ProjectRef[];
  options: ProjectRef[];
  onChange: (projectIds: string[]) => void;
  disabled?: boolean;
  className?: string;
}) {
  const available = options.filter((o) => !selected.some((s) => s.id === o.id));
  return (
    <div className={cn('flex flex-col gap-[6px]', className)} role="group" aria-label={label}>
      {selected.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-2 rounded-control bg-brand-wash px-[10px] py-[5px] text-[13px] font-semibold text-brand"
        >
          <span className="truncate">{p.name}</span>
          <button
            type="button"
            aria-label={`Remover ${p.name}`}
            disabled={disabled}
            className="cursor-pointer leading-none opacity-70 hover:opacity-100 disabled:cursor-default"
            onClick={() => onChange(selected.filter((s) => s.id !== p.id).map((s) => s.id))}
          >
            ×
          </button>
        </div>
      ))}
      {available.length > 0 ? (
        <Select
          aria-label={`${MESSAGES.projectsAddLabel} ${label.toLowerCase()}`}
          value=""
          disabled={disabled}
          onChange={(e) => {
            if (e.target.value) onChange([...selected.map((s) => s.id), e.target.value]);
          }}
          className="py-[6px] text-[13px] text-ink-muted"
        >
          <option value="">{MESSAGES.projectsAddLabel}</option>
          {available.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
      ) : (
        selected.length === 0 && (
          <span className="text-[13px] text-ink-muted">{MESSAGES.noProject}</span>
        )
      )}
    </div>
  );
}
