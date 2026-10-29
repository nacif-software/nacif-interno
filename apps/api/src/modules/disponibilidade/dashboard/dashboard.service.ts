import { APP_TIMEZONE, isoDateYear, todayIso, type DashboardDto } from '@nacif/shared';
import { and, asc, desc, eq, gte, inArray, lte, sum } from 'drizzle-orm';
import { db } from '../../../db/client';
import { communications } from '../../../db/schema';
import type { AuthenticatedUser } from '../../../infra/http/context';
import { toSummaryDto } from '../communications/communication.mapper';
import { communicationsRepository } from '../communications/communications.repository';

export const dashboardService = {
  async get(actor: AuthenticatedUser, now: Date = new Date()): Promise<DashboardDto> {
    const today = todayIso(APP_TIMEZONE, now);
    const year = isoDateYear(today);
    const mine = eq(communications.authorId, actor.id);
    const counting = inArray(communications.status, ['APPROVED', 'IN_REVIEW']);

    const [communicated, inReview, next, recent] = await Promise.all([
      db()
        .select({ total: sum(communications.businessDays).mapWith(Number) })
        .from(communications)
        .where(
          and(
            mine,
            counting,
            gte(communications.startDate, `${year}-01-01`),
            lte(communications.startDate, `${year}-12-31`),
          ),
        ),
      db().query.communications.findMany({
        where: and(mine, eq(communications.status, 'IN_REVIEW')),
        with: { approver: true },
        orderBy: [desc(communications.submittedAt)],
      }),
      db().query.communications.findFirst({
        where: and(mine, counting, gte(communications.endDate, today)),
        orderBy: [asc(communications.startDate)],
      }),
      communicationsRepository.findMany({
        where: mine,
        orderBy: [desc(communications.submittedAt)],
        limit: 5,
      }),
    ]);

    return {
      year,
      daysCommunicatedInYear: communicated[0]?.total ?? 0,
      inReviewCount: inReview.length,
      inReviewApproverName: inReview[0]?.approver.name ?? null,
      nextUnavailability: next
        ? {
            code: next.code,
            startDate: next.startDate,
            endDate: next.endDate,
            businessDays: next.businessDays,
            status: next.status,
          }
        : null,
      recent: recent.map(toSummaryDto),
    };
  },
};
