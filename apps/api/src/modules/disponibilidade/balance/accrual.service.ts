import {
  anniversaryOn,
  APP_TIMEZONE,
  pendingAnniversaryYears,
  todayIso,
  type AccrualRunResult,
} from '@nacif/shared';
import type { NewLedgerEntry } from '../../../db/types';
import { usersRepository } from '../../core/users/users.repository';
import { settingsRepository } from '../settings/settings.repository';
import { balanceRepository } from './balance.repository';

/**
 * Crédito anual de dias: a cada aniversário da data base, `daysPerYear` dias (a partir do primeiro
 * aniversário). Idempotente e com recuperação de anos perdidos: roda todo dia pelo cron, pode rodar
 * de novo a qualquer momento (índice único por pessoa e ano) e pessoas reativadas recebem o atraso.
 */
export const accrualService = {
  async runCatchUp(now: Date = new Date(), onlyUserId?: string): Promise<AccrualRunResult> {
    // 03:00 UTC é 00:00 em São Paulo: o "hoje" é o do fuso do time, para não creditar um dia cedo.
    const today = todayIso(APP_TIMEZONE, now);
    const settings = await settingsRepository.get();
    const people = await usersRepository.listAccrualCandidates(today, onlyUserId);
    const credited = await balanceRepository.creditedYears(people.map((p) => p.id));
    const entries: NewLedgerEntry[] = people.flatMap((person) => {
      const base = person.creditBaseDate;
      if (!base) return [];
      return pendingAnniversaryYears(base, today, credited.get(person.id)).map((year) => ({
        userId: person.id,
        type: 'ACCRUAL' as const,
        days: settings.daysPerYear,
        referenceDate: anniversaryOn(base, year),
        referenceYear: year,
        note: null,
        createdById: null,
      }));
    });
    const created = await balanceRepository.insertAccruals(entries);
    return { created };
  },
};
