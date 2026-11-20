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
  async insert(values: NewHoliday): Promise<Holiday> {
    const [row] = await db().insert(holidays).values(values).returning();
    if (!row) throw new Error('Feriado não gravado.');
    return row;
  },
  async remove(id: string): Promise<Holiday | undefined> {
    const [row] = await db().delete(holidays).where(eq(holidays.id, id)).returning();
    return row;
  },
};
