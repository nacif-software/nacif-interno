import { APP_TIMEZONE, countBusinessDays, MESSAGES, todayIso, type IsoDate } from '@nacif/shared';
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { batchAll, db } from '../../../db/client';
import { communications, flowEvents, type FlowEventMetadata } from '../../../db/schema';
import { flowEventsRepository } from '../communications/flow-events.repository';
import { holidaysRepository } from './holidays.repository';

/** Aprovadas cuja decisão vigente ajustou os dias descontados (o recálculo não mexe no desconto). */
async function adjustedApprovals(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const rows = await db()
    .select({ communicationId: flowEvents.communicationId, metadata: flowEvents.metadata })
    .from(flowEvents)
    .where(and(eq(flowEvents.type, 'DECISION'), inArray(flowEvents.communicationId, ids)))
    .orderBy(desc(flowEvents.occurredAt));
  const latest = new Map<string, FlowEventMetadata | null>();
  for (const r of rows)
    if (!latest.has(r.communicationId)) latest.set(r.communicationId, r.metadata);
  return new Set(
    [...latest]
      .filter(([, m]) => m && 'deductedDays' in m && m.deductedDays !== undefined)
      .map(([id]) => id),
  );
}

/**
 * Recontagem dos dias úteis das comunicações em análise ou aprovadas que começam hoje ou depois,
 * pelo calendário de feriados (ADR 0014). Roda junto com a mudança do calendário (mesmo batch) e no
 * cron das 00:00, que assim alcança quem começa no próprio dia. Em aprovadas, o desconto acompanha
 * só se o aprovador não ajustou os dias. Idempotente.
 */
export const recountService = {
  /** Statements da recontagem contra `holidays` (o calendário como ficará), para compor num batch. */
  async statements(
    holidays: ReadonlySet<IsoDate>,
    now: Date = new Date(),
  ): Promise<{ statements: BatchItem<'sqlite'>[]; recounted: number }> {
    const today = todayIso(APP_TIMEZONE, now);
    const rows = await db()
      .select()
      .from(communications)
      .where(
        and(
          inArray(communications.status, ['IN_REVIEW', 'APPROVED']),
          gte(communications.startDate, today),
        ),
      );
    const changed = rows
      .map((row) => ({
        row,
        businessDays: countBusinessDays(row.startDate, row.endDate, holidays),
      }))
      .filter(({ row, businessDays }) => businessDays !== row.businessDays);
    const adjusted = await adjustedApprovals(
      changed.filter(({ row }) => row.status === 'APPROVED').map(({ row }) => row.id),
    );

    const statements: BatchItem<'sqlite'>[] = [];
    for (const { row, businessDays } of changed) {
      const previous = row.businessDays;
      // Ajuste = decisão vigente com `deductedDays` na metadata ou desconto diferente dos dias úteis.
      const followDeduction =
        row.status === 'APPROVED' &&
        !adjusted.has(row.id) &&
        (row.deductedDays ?? previous) === previous;
      statements.push(
        db()
          .update(communications)
          .set({ businessDays, ...(followDeduction ? { deductedDays: businessDays } : {}) })
          .where(
            and(
              eq(communications.id, row.id),
              eq(communications.status, row.status),
              eq(communications.startDate, row.startDate),
              eq(communications.endDate, row.endDate),
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
          // Só se o UPDATE logo acima (mesmo batch) aplicou: duas recontagens simultâneas não
          // registram o evento duas vezes.
          sql`changes() = 1`,
        ),
      );
    }
    return { statements, recounted: changed.length };
  },

  /** Recontagem com o calendário atual (cron). */
  async recountUpcoming(now: Date = new Date()): Promise<{ recounted: number }> {
    const { statements, recounted } = await this.statements(
      await holidaysRepository.dateSet(),
      now,
    );
    if (statements.length > 0) await batchAll(statements);
    return { recounted };
  },
};
