import { toIsoDate, type ConflictDto, type DateRange } from '@nacif/shared';
import { parseIsoDate } from '@nacif/shared';
import { db, type DbOrTx } from '../../../infra/prisma/client';

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
  tx: DbOrTx = db,
): Promise<{ conflicts: ConflictDto[]; limitReached: boolean }> {
  const rows = await tx.communication.findMany({
    where: {
      projectId: input.projectId,
      status: 'APPROVED',
      authorId: { not: input.excludeUserId },
      ...(input.excludeCommunicationId ? { id: { not: input.excludeCommunicationId } } : {}),
      startDate: { lte: parseIsoDate(input.range.endDate) },
      endDate: { gte: parseIsoDate(input.range.startDate) },
    },
    include: { author: true },
    orderBy: [{ startDate: 'asc' }, { author: { name: 'asc' } }],
  });
  const conflicts: ConflictDto[] = rows.map((r) => ({
    userId: r.authorId,
    name: r.author.name,
    startDate: toIsoDate(r.startDate),
    endDate: toIsoDate(r.endDate),
    status: r.status,
  }));
  const distinctPeople = new Set(conflicts.map((c) => c.userId)).size;
  return { conflicts, limitReached: distinctPeople >= input.maxSimultaneousPerProject };
}
