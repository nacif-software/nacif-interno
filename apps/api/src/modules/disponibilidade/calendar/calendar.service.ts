import {
  CALENDAR_STATUSES,
  clampRange,
  daysInMonth,
  getInitials,
  isApproverRole,
  isWeekend,
  monthEnd,
  monthStart,
  type CalendarMonthDto,
  type CalendarQuery,
  type CalendarRow,
} from '@nacif/shared';
import { and, asc, eq, gte, inArray, isNotNull, lte } from 'drizzle-orm';
import { db } from '../../../db/client';
import { communications, users } from '../../../db/schema';

export const calendarService = {
  async month(query: CalendarQuery): Promise<CalendarMonthDto> {
    const bounds = { startDate: monthStart(query.month), endDate: monthEnd(query.month) };

    const [people, rows] = await Promise.all([
      db().query.users.findMany({
        where: and(
          eq(users.active, true),
          isNotNull(users.passwordHash),
          query.projectId ? eq(users.projectId, query.projectId) : undefined,
        ),
        with: { project: true },
      }),
      db().query.communications.findMany({
        where: and(
          inArray(communications.status, [...CALENDAR_STATUSES]),
          lte(communications.startDate, bounds.endDate),
          gte(communications.endDate, bounds.startDate),
          query.projectId ? eq(communications.projectId, query.projectId) : undefined,
        ),
        orderBy: [asc(communications.startDate)],
      }),
    ]);

    // Projeto (quem não tem projeto vai para o fim) e nome, com ordenação pt-BR.
    const collator = new Intl.Collator('pt-BR');
    people.sort((a, b) => {
      if (!a.project !== !b.project) return a.project ? -1 : 1;
      return (
        collator.compare(a.project?.name ?? '', b.project?.name ?? '') ||
        collator.compare(a.name, b.name)
      );
    });

    const byUser = new Map<string, typeof rows>();
    for (const c of rows) {
      const list = byUser.get(c.authorId) ?? [];
      list.push(c);
      byUser.set(c.authorId, list);
    }

    const calendarRows: CalendarRow[] = people.map((u) => ({
      user: { id: u.id, name: u.name, initials: getInitials(u.name) },
      project: u.project ? { id: u.project.id, name: u.project.name } : null,
      isApprover: isApproverRole(u.role),
      bars: (byUser.get(u.id) ?? []).flatMap((c) => {
        const range = { startDate: c.startDate, endDate: c.endDate };
        const clamped = clampRange(range, bounds);
        if (!clamped) return [];
        return [
          {
            communicationId: c.id,
            code: c.code,
            status: c.status,
            startDate: range.startDate,
            endDate: range.endDate,
            businessDays: c.businessDays,
            clampedStart: clamped.startDate,
            clampedEnd: clamped.endDate,
          },
        ];
      }),
    }));

    const total = daysInMonth(query.month);
    const days = Array.from({ length: total }, (_, i) => {
      const date = `${query.month}-${String(i + 1).padStart(2, '0')}`;
      return { date, weekend: isWeekend(date) };
    });

    return { month: query.month, days, rows: calendarRows };
  },
};
