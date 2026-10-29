import { createApp } from './app';
import { bindConfig } from './config/env';
import { bindDb } from './db/client';
import { logger } from './infra/logger';
import { maintenanceService } from './modules/core/maintenance/maintenance.service';

const app = createApp();

export default {
  fetch: app.fetch,

  /** Cron diário (ver `triggers.crons` no wrangler.jsonc): limpa sessões e tokens expirados. */
  async scheduled(controller, env) {
    bindConfig(env);
    bindDb(env.DB);
    const result = await maintenanceService.purgeExpired(new Date(controller.scheduledTime));
    logger.info({ cron: controller.cron, ...result }, 'Limpeza concluída');
  },
} satisfies ExportedHandler<Env>;
