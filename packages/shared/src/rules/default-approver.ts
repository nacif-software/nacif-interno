import type { PersonRef } from '../schemas/common';

/**
 * Aprovador pré-selecionado no formulário: se os projetos da pessoa apontam para um único
 * aprovador padrão, é ele; senão, o primeiro aprovador padrão global.
 */
export function defaultApproverFor(
  projects: { defaultApprover: PersonRef | null }[],
  settings: { defaultApprovers: PersonRef[] },
): PersonRef | null {
  const distinct = new Map<string, PersonRef>();
  for (const p of projects)
    if (p.defaultApprover) distinct.set(p.defaultApprover.id, p.defaultApprover);
  if (distinct.size === 1) return [...distinct.values()][0] ?? null;
  return settings.defaultApprovers[0] ?? null;
}
