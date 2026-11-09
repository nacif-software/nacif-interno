import { createApp } from './app';
import { bindConfig } from './config/env';
import { bindDb } from './db/client';
import { logger } from './infra/logger';
import { maintenanceService } from './modules/core/maintenance/maintenance.service';
import { accrualService } from './modules/disponibilidade/balance/accrual.service';

const app = createApp();

export default {
  fetch: app.fetch,

  /**
   * Cron diário (ver `triggers.crons` no wrangler.jsonc): limpa sessões e tokens expirados e
   * lança o crédito anual de dias de quem fez aniversário da data base.
   */
  async scheduled(controller, env) {
    bindConfig(env);
    bindDb(env.DB);
    const now = new Date(controller.scheduledTime);
    const purged = await maintenanceService.purgeExpired(now);
    logger.info({ cron: controller.cron, ...purged }, 'Limpeza concluída');
    const accrued = await accrualService.runCatchUp(now);
    logger.info({ cron: controller.cron, ...accrued }, 'Crédito anual de dias processado');
  },
} satisfies ExportedHandler<Env>;
