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
import { and, asc, eq, gte, inArray, isNotNull, lte, sql } from 'drizzle-orm';
import { db } from '../../../db/client';
import { communications, userProjects, users } from '../../../db/schema';
import { projectRefs } from '../../core/users/user.mapper';

export const calendarService = {
  async month(query: CalendarQuery): Promise<CalendarMonthDto> {
    const bounds = { startDate: monthStart(query.month), endDate: monthEnd(query.month) };

    const inProject = (userColumn: typeof users.id | typeof communications.authorId) =>
      query.projectId
        ? sql`exists (
            select 1 from ${userProjects} up
            where up.user_id = ${userColumn} and up.project_id = ${query.projectId}
          )`
        : undefined;
    const [people, rows] = await Promise.all([
      db().query.users.findMany({
        where: and(eq(users.active, true), isNotNull(users.passwordHash), inProject(users.id)),
        with: { projects: { with: { project: true } } },
      }),
      db().query.communications.findMany({
        where: and(
          inArray(communications.status, [...CALENDAR_STATUSES]),
          lte(communications.startDate, bounds.endDate),
          gte(communications.endDate, bounds.startDate),
          inProject(communications.authorId),
        ),
        orderBy: [asc(communications.startDate)],
      }),
    ]);

    // Primeiro projeto (quem não tem projeto vai para o fim) e nome, com ordenação pt-BR.
    const collator = new Intl.Collator('pt-BR');
    const firstProject = (u: (typeof people)[number]) => projectRefs(u)[0]?.name ?? null;
    people.sort((a, b) => {
      const pa = firstProject(a);
      const pb = firstProject(b);
      if (!pa !== !pb) return pa ? -1 : 1;
      return collator.compare(pa ?? '', pb ?? '') || collator.compare(a.name, b.name);
    });

    const byUser = new Map<string, typeof rows>();
    for (const c of rows) {
      const list = byUser.get(c.authorId) ?? [];
      list.push(c);
      byUser.set(c.authorId, list);
    }

    const calendarRows: CalendarRow[] = people.map((u) => ({
      user: { id: u.id, name: u.name, initials: getInitials(u.name) },
      projects: projectRefs(u),
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
