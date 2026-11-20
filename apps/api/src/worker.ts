import { createApp } from './app';
import { bindConfig } from './config/env';
import { bindDb } from './db/client';
import { bindBackground } from './infra/http/background';
import { logger } from './infra/logger';
import { maintenanceService } from './modules/core/maintenance/maintenance.service';
import { accrualService } from './modules/disponibilidade/balance/accrual.service';
import { recountService } from './modules/disponibilidade/holidays/recount.service';

const app = createApp();

export default {
  fetch: app.fetch,

  /**
   * Cron diário (ver `triggers.crons` no wrangler.jsonc): limpa sessões e tokens expirados e
   * lança o crédito anual de dias de quem fez aniversário da data base e reconta os dias úteis das
   * comunicações futuras pelo calendário de feriados.
   */
  async scheduled(controller, env, ctx) {
    bindConfig(env);
    bindDb(env.DB);
    bindBackground(ctx ? (p) => ctx.waitUntil(p) : null);
    const now = new Date(controller.scheduledTime);
    const purged = await maintenanceService.purgeExpired(now);
    logger.info({ cron: controller.cron, ...purged }, 'Limpeza concluída');
    const accrued = await accrualService.runCatchUp(now);
    logger.info({ cron: controller.cron, ...accrued }, 'Crédito anual de dias processado');
    const recounted = await recountService.recountUpcoming(now);
    logger.info(
      { cron: controller.cron, ...recounted },
      'Dias úteis recontados pelo calendário de feriados',
    );
  },
} satisfies ExportedHandler<Env>;
