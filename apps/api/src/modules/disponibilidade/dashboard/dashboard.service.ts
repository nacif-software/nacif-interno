import {
  APP_TIMEZONE,
  isoDateYear,
  parseIsoDate,
  todayIso,
  toIsoDate,
  type DashboardDto,
} from '@nacif/shared';
import type { AuthenticatedUser } from '../../../infra/http/require-auth';
import { db } from '../../../infra/prisma/client';
import { toSummaryDto } from '../communications/communication.mapper';
import { communicationsRepository } from '../communications/communications.repository';

export const dashboardService = {
  async get(actor: AuthenticatedUser, now: Date = new Date()): Promise<DashboardDto> {
    const today = todayIso(APP_TIMEZONE, now);
    const year = isoDateYear(today);
    const yearStart = parseIsoDate(`${year}-01-01`);
    const yearEnd = parseIsoDate(`${year}-12-31`);

    const [communicated, inReview, next, recent] = await Promise.all([
      db.communication.aggregate({
        _sum: { businessDays: true },
        where: {
          authorId: actor.id,
          status: { in: ['APPROVED', 'IN_REVIEW'] },
          startDate: { gte: yearStart, lte: yearEnd },
        },
      }),
      db.communication.findMany({
        where: { authorId: actor.id, status: 'IN_REVIEW' },
        include: { approver: true },
        orderBy: { submittedAt: 'desc' },
      }),
      db.communication.findFirst({
        where: {
          authorId: actor.id,
          status: { in: ['APPROVED', 'IN_REVIEW'] },
          endDate: { gte: parseIsoDate(today) },
        },
        orderBy: { startDate: 'asc' },
      }),
      communicationsRepository.findMany({
        where: { authorId: actor.id },
        orderBy: { submittedAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      year,
      daysCommunicatedInYear: communicated._sum.businessDays ?? 0,
      inReviewCount: inReview.length,
      inReviewApproverName: inReview[0]?.approver.name ?? null,
      nextUnavailability: next
        ? {
            code: next.code,
            startDate: toIsoDate(next.startDate),
            endDate: toIsoDate(next.endDate),
            businessDays: next.businessDays,
            status: next.status,
          }
        : null,
      recent: recent.map(toSummaryDto),
    };
  },
};
