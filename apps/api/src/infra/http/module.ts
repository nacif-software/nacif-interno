import type { ServiceDescriptor } from '@nacif/shared';
import type { Express, Router } from 'express';

/** Um módulo da API: prefixo, roteador e, opcionalmente, o serviço que aparece no portal. */
export interface ApiModule {
  slug: string;
  /** Prefixo abaixo de /api. Ex.: '' (core) ou '/disponibilidade'. */
  prefix: string;
  router: Router;
  service?: ServiceDescriptor;
}

export function registerModules(app: Express, modules: readonly ApiModule[]): void {
  app.locals.modules = modules;
  for (const mod of modules) {
    app.use(`/api${mod.prefix}`, mod.router);
  }
}
