import { APP_TIMEZONE, countBusinessDays, MESSAGES, todayIso } from '@nacif/shared';
import { and, eq, gt, inArray, sql } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { batchAll, db } from '../../../db/client';
import { communications } from '../../../db/schema';
import { flowEventsRepository } from '../communications/flow-events.repository';
import { holidaysRepository } from './holidays.repository';

/**
 * Reconta os dias úteis das comunicações em análise ou aprovadas que ainda não começaram, pelo
 * calendário de feriados atual (ADR 0014). Roda depois de mudar o calendário e no cron diário.
 * Em aprovadas, o desconto acompanha só se não foi ajustado pelo aprovador. Idempotente.
 */
export const recountService = {
  async recountUpcoming(now: Date = new Date()): Promise<{ recounted: number }> {
    const today = todayIso(APP_TIMEZONE, now);
    const [holidays, rows] = await Promise.all([
      holidaysRepository.dateSet(),
      db()
        .select()
        .from(communications)
        .where(
          and(
            inArray(communications.status, ['IN_REVIEW', 'APPROVED']),
            gt(communications.startDate, today),
          ),
        ),
    ]);

    const statements: BatchItem<'sqlite'>[] = [];
    let recounted = 0;
    for (const row of rows) {
      const businessDays = countBusinessDays(row.startDate, row.endDate, holidays);
      const previous = row.businessDays;
      if (businessDays === previous) continue;
      recounted++;
      const followDeduction =
        row.status === 'APPROVED' && (row.deductedDays ?? previous) === previous;
      statements.push(
        db()
          .update(communications)
          .set({ businessDays, ...(followDeduction ? { deductedDays: businessDays } : {}) })
          .where(
            and(
              eq(communications.id, row.id),
              eq(communications.status, row.status),
              eq(communications.businessDays, previous),
            ),
          ),
        flowEventsRepository.insertIf(
          {
            communicationId: row.id,
            type: 'EDITED',
            actorId: null,
            occurredAt: now,
            description: MESSAGES.holidayRecountEvent(previous, businessDays),
            metadata: { recount: { previousBusinessDays: previous, businessDays } },
          },
          sql`exists (
            select 1 from ${communications}
            where ${communications.id} = ${row.id} and ${communications.businessDays} = ${businessDays}
              and ${communications.status} = ${row.status}
          )`,
        ),
      );
    }
    if (statements.length > 0) await batchAll(statements);
    return { recounted };
  },
};
