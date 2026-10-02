import type { Role, ServiceDescriptor } from '@nacif/shared';
import type { RouteObject } from 'react-router';
import { coreModule } from './core/manifest';
import { disponibilidadeModule } from './disponibilidade/manifest';

export interface NavItem {
  label: string;
  to: string;
  /** Rótulo curto para a tab bar mobile. */
  shortLabel?: string;
  /** Casa rotas filhas (ex.: /disponibilidade/comunicacoes/*). */
  end?: boolean;
}

export interface WebModule {
  slug: string;
  routes: RouteObject[];
  /** Descritor mostrado no portal; ausente para o core. */
  service?: ServiceDescriptor;
  /** Itens de navegação do módulo por papel. */
  navItems?: (role: Role) => NavItem[];
}

export const webModules: readonly WebModule[] = [coreModule, disponibilidadeModule];

export function findModuleByPath(pathname: string): WebModule | undefined {
  return webModules.find((m) => m.service && pathname.startsWith(m.service.path));
}
