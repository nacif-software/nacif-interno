import type { IsoDate } from '@nacif/shared';
import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { db } from '../../../db/client';
import { holidays } from '../../../db/schema';
import type { Holiday, NewHoliday } from '../../../db/types';

export const holidaysRepository = {
  list(): Promise<Holiday[]> {
    return db().select().from(holidays).orderBy(asc(holidays.date));
  },
  /** Datas do calendário, para a contagem de dias úteis (tabela pequena: lê tudo). */
  async dateSet(): Promise<ReadonlySet<IsoDate>> {
    const rows = await db().select({ date: holidays.date }).from(holidays);
    return new Set(rows.map((r) => r.date));
  },
  inRange(startDate: IsoDate, endDate: IsoDate): Promise<Holiday[]> {
    return db()
      .select()
      .from(holidays)
      .where(and(gte(holidays.date, startDate), lte(holidays.date, endDate)))
      .orderBy(asc(holidays.date));
  },
  findById(id: string): Promise<Holiday | undefined> {
    return db().query.holidays.findFirst({ where: eq(holidays.id, id) });
  },
  /** Builders para compor em `batch()` com a recontagem. */
  insert(values: NewHoliday & { id: string }) {
    return db().insert(holidays).values(values);
  },
  remove(id: string) {
    return db().delete(holidays).where(eq(holidays.id, id));
  },
};
