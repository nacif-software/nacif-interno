import { cn } from '@/lib/cn';
import { Badge, type BadgeSize } from './badge';
import { Chip } from './chip';
import { DropdownMenu, MenuItem } from './dropdown-menu';

export interface RefItem {
  id: string;
  name: string;
}

/**
 * Lista de itens selecionados como chips removíveis (×) + chip tracejado para adicionar a partir
 * das opções restantes. Usado em aprovadores padrão e projetos da pessoa.
 */
export function RefChips({
  label,
  selected,
  options,
  onChange,
  addLabel,
  emptyLabel,
  size = 'lg',
  disabled,
  className,
}: {
  label: string;
  selected: RefItem[];
  options: RefItem[];
  onChange: (ids: string[]) => void;
  addLabel: string;
  /** Texto quando não há selecionados nem opções. */
  emptyLabel?: string;
  size?: BadgeSize;
  disabled?: boolean;
  className?: string;
}) {
  const available = options.filter((o) => !selected.some((s) => s.id === o.id));
  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      role="group"
      aria-label={label}
    >
      {selected.map((item) => (
        <Badge key={item.id} tone="brand" size={size} className="gap-2">
          {item.name}
          <button
            type="button"
            aria-label={`Remover ${item.name}`}
            disabled={disabled}
            className="cursor-pointer opacity-70 hover:opacity-100 disabled:cursor-default"
            onClick={() => onChange(selected.filter((s) => s.id !== item.id).map((s) => s.id))}
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
              className={size === 'md' ? 'text-[12px]' : undefined}
            >
              {addLabel}
            </Chip>
          )}
        >
          {available.map((o) => (
            <MenuItem key={o.id} onClick={() => onChange([...selected.map((s) => s.id), o.id])}>
              {o.name}
            </MenuItem>
          ))}
        </DropdownMenu>
      )}
      {emptyLabel && selected.length === 0 && available.length === 0 && (
        <span className="text-[13px] text-ink-muted">{emptyLabel}</span>
      )}
    </div>
  );
}
