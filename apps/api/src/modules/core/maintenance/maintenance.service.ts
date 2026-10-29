import { passwordSetupTokenRepository } from '../auth/password-setup-token.repository';
import { sessionRepository } from '../auth/session.repository';

const STALE_TOKEN_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Rotina do Cron Trigger: remove o que já não serve para nada. */
export const maintenanceService = {
  async purgeExpired(now: Date = new Date()) {
    const sessions = await sessionRepository.deleteExpired(now);
    const tokens = await passwordSetupTokenRepository.deleteStale(
      now,
      new Date(now.getTime() - STALE_TOKEN_AGE_MS),
    );
    return { sessionsDeleted: sessions, tokensDeleted: tokens };
  },
};
