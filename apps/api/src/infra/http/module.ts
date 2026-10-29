import type { ServiceDescriptor } from '@nacif/shared';
import type { AppRouter } from './context';

/** Um módulo da API: prefixo, roteador e, opcionalmente, o serviço que aparece no portal. */
export interface ApiModule {
  slug: string;
  /** Prefixo abaixo de /api. Ex.: '' (core) ou '/disponibilidade'. */
  prefix: string;
  router: AppRouter;
  service?: ServiceDescriptor;
}

export function registerModules(app: AppRouter, modules: readonly ApiModule[]): void {
  app.use('*', async (c, next) => {
    c.set('modules', modules);
    await next();
  });
  for (const mod of modules) {
    app.route(`/api${mod.prefix}`, mod.router);
  }
}
