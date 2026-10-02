import type { ServiceDescriptor } from '@nacif/shared';
import type { ApiModule } from '../../../infra/http/module';

/** Serviços ainda sem módulo, mostrados no portal como "Em breve". */
export const PLANNED_SERVICES: ServiceDescriptor[] = [
  {
    slug: 'hermes',
    name: 'Hermes',
    description: 'Integração com o Hermes. Em planejamento.',
    path: '/hermes',
    status: 'coming_soon',
  },
];

export function buildServiceList(modules: readonly ApiModule[]): ServiceDescriptor[] {
  const fromModules = modules.flatMap((m) => (m.service ? [m.service] : []));
  const slugs = new Set(fromModules.map((s) => s.slug));
  return [...fromModules, ...PLANNED_SERVICES.filter((s) => !slugs.has(s.slug))];
}
