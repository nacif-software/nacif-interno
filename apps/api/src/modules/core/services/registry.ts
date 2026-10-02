import type { ServiceDescriptor } from '@nacif/shared';
import type { ApiModule } from '../../../infra/http/module';

/**
 * Serviços ainda sem módulo, mostrados no portal como "Em breve".
 * Vazio hoje. Só entra aqui o que será um serviço aberto pelo portal.
 * O Hermes Agent não é um deles: é um agente externo que consulta dados
 * por MCP (docs/issues/007 e 002).
 */
export const PLANNED_SERVICES: ServiceDescriptor[] = [];

export function buildServiceList(modules: readonly ApiModule[]): ServiceDescriptor[] {
  const fromModules = modules.flatMap((m) => (m.service ? [m.service] : []));
  const slugs = new Set(fromModules.map((s) => s.slug));
  return [...fromModules, ...PLANNED_SERVICES.filter((s) => !slugs.has(s.slug))];
}
