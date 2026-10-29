import { and, asc, count, desc, eq, isNull, sql, type SQL } from 'drizzle-orm';
import { db } from '../../../db/client';
import { communications, decisions, flowEvents } from '../../../db/schema';
import type { CommunicationRow, NewCommunication } from '../../../db/types';

/** Relações que os mappers leem; a decisão vigente é a última não revertida. */
function withRelations() {
  return {
    author: true as const,
    cover: true as const,
    approver: true as const,
    project: true as const,
    decisions: {
      where: isNull(decisions.revertedAt),
      orderBy: [desc(decisions.decidedAt)],
      limit: 1,
    },
    // `rowid` desempata eventos gravados no mesmo instante (SUBMITTED e IN_REVIEW do envio).
    events: { orderBy: [asc(flowEvents.occurredAt), sql`rowid`], with: { actor: true as const } },
  };
}

export const communicationsRepository = {
  findById(id: string): Promise<CommunicationRow | undefined> {
    return db().query.communications.findFirst({
      where: eq(communications.id, id),
      with: withRelations(),
    });
  },
  findByCode(code: string): Promise<CommunicationRow | undefined> {
    return db().query.communications.findFirst({
      where: eq(communications.code, code),
      with: withRelations(),
    });
  },
  findMany(args: {
    where?: SQL;
    offset?: number;
    limit?: number;
    orderBy?: SQL[];
  }): Promise<CommunicationRow[]> {
    return db().query.communications.findMany({ ...args, with: withRelations() });
  },
  async count(where?: SQL): Promise<number> {
    const [row] = await db().select({ count: count() }).from(communications).where(where);
    return row?.count ?? 0;
  },
  /** Builder para compor em `batch()`; o chamador gera o `id` antes. */
  insert(data: NewCommunication & { id: string }) {
    return db().insert(communications).values(data);
  },
  /** Builder para compor em `batch()`. Com `onlyIfStatus`, a linha só muda se ainda estiver nesse status. */
  update(id: string, data: Partial<NewCommunication>, onlyIfStatus?: NewCommunication['status']) {
    return db()
      .update(communications)
      .set(data)
      .where(
        and(
          eq(communications.id, id),
          onlyIfStatus ? eq(communications.status, onlyIfStatus) : undefined,
        ),
      )
      .returning({ id: communications.id });
  },
};
