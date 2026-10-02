import {
  CALENDAR_STATUSES,
  clampRange,
  daysInMonth,
  getInitials,
  isApproverRole,
  isWeekend,
  monthEnd,
  monthStart,
  parseIsoDate,
  toIsoDate,
  type CalendarMonthDto,
  type CalendarQuery,
  type CalendarRow,
} from '@nacif/shared';
import { db } from '../../../infra/prisma/client';

export const calendarService = {
  async month(query: CalendarQuery): Promise<CalendarMonthDto> {
    const bounds = { startDate: monthStart(query.month), endDate: monthEnd(query.month) };
    const projectFilter = query.projectId ? { projectId: query.projectId } : {};

    const [users, communications] = await Promise.all([
      db.user.findMany({
        where: { active: true, passwordHash: { not: null }, ...projectFilter },
        include: { project: true },
        orderBy: [{ project: { name: 'asc' } }, { name: 'asc' }],
      }),
      db.communication.findMany({
        where: {
          status: { in: [...CALENDAR_STATUSES] },
          startDate: { lte: parseIsoDate(bounds.endDate) },
          endDate: { gte: parseIsoDate(bounds.startDate) },
          ...projectFilter,
        },
        orderBy: { startDate: 'asc' },
      }),
    ]);

    const byUser = new Map<string, typeof communications>();
    for (const c of communications) {
      const list = byUser.get(c.authorId) ?? [];
      list.push(c);
      byUser.set(c.authorId, list);
    }

    const rows: CalendarRow[] = users.map((u) => ({
      user: { id: u.id, name: u.name, initials: getInitials(u.name) },
      project: u.project ? { id: u.project.id, name: u.project.name } : null,
      isApprover: isApproverRole(u.role),
      bars: (byUser.get(u.id) ?? []).flatMap((c) => {
        const range = { startDate: toIsoDate(c.startDate), endDate: toIsoDate(c.endDate) };
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

    return { month: query.month, days, rows };
  },
};
