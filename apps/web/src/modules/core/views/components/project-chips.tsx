import { MESSAGES, type ProjectRef } from '@nacif/shared';
import { Badge, Chip, DropdownMenu, MenuItem } from '@/ui';

/** Projetos da pessoa como chips removíveis + "+ adicionar" (mesmo padrão dos aprovadores padrão). */
export function ProjectChips({
  label,
  selected,
  options,
  onChange,
  disabled,
}: {
  label: string;
  selected: ProjectRef[];
  options: ProjectRef[];
  onChange: (projectIds: string[]) => void;
  disabled?: boolean;
}) {
  const available = options.filter((p) => !selected.some((s) => s.id === p.id));
  return (
    <div className="flex flex-wrap items-center gap-[6px]" role="group" aria-label={label}>
      {selected.map((p) => (
        <Badge key={p.id} tone="brand" size="md" className="gap-[6px]">
          {p.name}
          <button
            type="button"
            aria-label={`Remover ${p.name}`}
            disabled={disabled}
            className="cursor-pointer opacity-70 hover:opacity-100 disabled:cursor-default"
            onClick={() => onChange(selected.filter((s) => s.id !== p.id).map((s) => s.id))}
          >
            ×
          </button>
        </Badge>
      ))}
      {available.length > 0 && (
        <DropdownMenu
          align="left"
          trigger={({ open: _open, ...props }) => (
            <Chip
              {...props}
              dashed
              disabled={disabled}
              aria-haspopup="menu"
              className="text-[12px]"
            >
              {MESSAGES.projectsAdd}
            </Chip>
          )}
        >
          {available.map((p) => (
            <MenuItem key={p.id} onClick={() => onChange([...selected.map((s) => s.id), p.id])}>
              {p.name}
            </MenuItem>
          ))}
        </DropdownMenu>
      )}
      {selected.length === 0 && available.length === 0 && (
        <span className="text-[13px] text-ink-muted">{MESSAGES.noProject}</span>
      )}
    </div>
  );
}
