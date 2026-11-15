import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../../../db/client';
import { pushSubscriptions } from '../../../db/schema';
import type { NewPushSubscription, PushSubscriptionRow } from '../../../db/types';

export const pushRepository = {
  listByUsers(userIds: string[]): Promise<PushSubscriptionRow[]> {
    if (userIds.length === 0) return Promise.resolve([]);
    return db().select().from(pushSubscriptions).where(inArray(pushSubscriptions.userId, userIds));
  },
  listByUser(userId: string): Promise<PushSubscriptionRow[]> {
    return db().select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  },
  /** Cria ou atualiza pela URL do endpoint (o mesmo navegador reassinando troca de pessoa se o login mudou). */
  async upsert(row: NewPushSubscription): Promise<void> {
    await db()
      .insert(pushSubscriptions)
      .values(row)
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { userId: row.userId, p256dh: row.p256dh, auth: row.auth, userAgent: row.userAgent },
      });
  },
  /** Apaga pela URL; com `userId`, só se for da própria pessoa. Devolve quantas saíram. */
  async deleteByEndpoint(endpoint: string, userId?: string): Promise<number> {
    const rows = await db()
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.endpoint, endpoint),
          userId ? eq(pushSubscriptions.userId, userId) : undefined,
        ),
      )
      .returning({ id: pushSubscriptions.id });
    return rows.length;
  },
  async touch(id: string, at: Date): Promise<void> {
    await db()
      .update(pushSubscriptions)
      .set({ lastUsedAt: at })
      .where(eq(pushSubscriptions.id, id));
  },
};
