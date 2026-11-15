import { MESSAGES, type ProjectRef } from '@nacif/shared';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { Checkbox, DropdownMenu } from '@/ui';

/**
 * Projetos de uma pessoa numa coluna estreita: um dropdown compacto resume (`Sem projeto`, o nome
 * ou `N projetos`) e lista todos os projetos ativos da empresa, cada um com um checkbox à direita
 * marcando os da pessoa. Marcar/desmarcar chama `onChange` na hora e o painel fica aberto até
 * clicar fora. O estado é otimista: se `onChange` devolver uma promise que rejeita, a marcação
 * volta ao que veio em `selected`; quando `selected` muda (resposta do servidor), o rascunho
 * acompanha sem fechar o painel.
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
  onChange: (projectIds: string[]) => void | Promise<unknown>;
  disabled?: boolean;
  className?: string;
}) {
  const selectedKey = selected.map((s) => s.id).join(',');
  const [ids, setIds] = useState(() => selected.map((s) => s.id));
  // Resposta do servidor mudou os projetos: o rascunho acompanha (ajuste de estado durante o render).
  const [syncedKey, setSyncedKey] = useState(selectedKey);
  if (syncedKey !== selectedKey) {
    setSyncedKey(selectedKey);
    setIds(selectedKey ? selectedKey.split(',') : []);
  }
  // Projetos inativos que a pessoa ainda tem continuam na lista para poderem ser desmarcados.
  const rows = [...options, ...selected.filter((s) => !options.some((o) => o.id === s.id))];
  const checked = rows.filter((r) => ids.includes(r.id));
  const summary =
    checked.length === 0
      ? MESSAGES.noProject
      : checked.length === 1
        ? checked[0]!.name
        : MESSAGES.projectsCount(checked.length);
  const toggle = (id: string, on: boolean) => {
    const next = on ? [...ids, id] : ids.filter((x) => x !== id);
    setIds(next);
    void Promise.resolve(onChange(next)).catch(() => setIds(selected.map((s) => s.id)));
  };
  return (
    <div className={cn('min-w-0', className)} role="group" aria-label={label}>
      <DropdownMenu
        align="left"
        compact
        closeOnSelect={false}
        role="group"
        aria-label={label}
        className="w-full"
        trigger={({ open, ...props }) => (
          <button
            type="button"
            {...props}
            aria-haspopup="true"
            disabled={disabled}
            className={cn(
              'relative w-full rounded-control border border-line bg-white py-[7px] pr-10 pl-[14px] text-left text-[13px] leading-[1.5] font-semibold cursor-pointer focus:border-ink focus:outline-none disabled:bg-canvas disabled:opacity-70',
              checked.length > 0 ? 'text-ink' : 'text-ink-muted',
              open && 'border-ink',
            )}
          >
            <span className="block truncate">{summary}</span>
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-ink-muted"
            />
          </button>
        )}
      >
        {rows.length === 0 ? (
          <p className="px-[10px] py-[6px] text-[13px] text-ink-muted">{MESSAGES.noProject}</p>
        ) : (
          rows.map((p) => (
            <label
              key={p.id}
              className="flex items-center justify-between gap-4 rounded-badge px-[10px] py-[6px] text-[13px] text-ink hover:bg-canvas cursor-pointer"
            >
              <span className="truncate">{p.name}</span>
              <Checkbox
                checked={ids.includes(p.id)}
                disabled={disabled}
                onChange={(e) => toggle(p.id, e.target.checked)}
              />
            </label>
          ))
        )}
      </DropdownMenu>
    </div>
  );
}
