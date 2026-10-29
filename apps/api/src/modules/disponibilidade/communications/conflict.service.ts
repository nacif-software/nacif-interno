import type { ConflictDto, DateRange } from '@nacif/shared';
import { and, asc, eq, gte, lte, ne } from 'drizzle-orm';
import { db } from '../../../db/client';
import { communications } from '../../../db/schema';

export interface ConflictLookup {
  projectId: string;
  range: DateRange;
  excludeUserId: string;
  excludeCommunicationId?: string;
  maxSimultaneousPerProject: number;
}

/**
 * Conflito = outra pessoa do mesmo projeto com indisponibilidade APROVADA sobrepondo o período.
 * `limitReached` indica que o número de pessoas já aprovadas atinge o limite configurado.
 */
export async function findConflicts(
  input: ConflictLookup,
): Promise<{ conflicts: ConflictDto[]; limitReached: boolean }> {
  const rows = await db().query.communications.findMany({
    where: and(
      eq(communications.projectId, input.projectId),
      eq(communications.status, 'APPROVED'),
      ne(communications.authorId, input.excludeUserId),
      input.excludeCommunicationId
        ? ne(communications.id, input.excludeCommunicationId)
        : undefined,
      lte(communications.startDate, input.range.endDate),
      gte(communications.endDate, input.range.startDate),
    ),
    with: { author: true },
    orderBy: [asc(communications.startDate)],
  });
  const conflicts: ConflictDto[] = rows
    .sort(
      (a, b) =>
        a.startDate.localeCompare(b.startDate) ||
        a.author.name.localeCompare(b.author.name, 'pt-BR'),
    )
    .map((r) => ({
      userId: r.authorId,
      name: r.author.name,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
    }));
  const distinctPeople = new Set(conflicts.map((c) => c.userId)).size;
  return { conflicts, limitReached: distinctPeople >= input.maxSimultaneousPerProject };
}
