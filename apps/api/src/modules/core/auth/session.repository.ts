import { eq, lt } from 'drizzle-orm';
import { db } from '../../../db/client';
import { sessions } from '../../../db/schema';

export const sessionRepository = {
  create(data: { id: string; userId: string; expiresAt: Date }) {
    return db().insert(sessions).values(data);
  },
  findWithUser(id: string) {
    return db().query.sessions.findFirst({
      where: eq(sessions.id, id),
      with: { user: { with: { project: true } } },
    });
  },
  touch(id: string, lastSeenAt: Date, expiresAt: Date) {
    return db().update(sessions).set({ lastSeenAt, expiresAt }).where(eq(sessions.id, id));
  },
  delete(id: string) {
    return db().delete(sessions).where(eq(sessions.id, id));
  },
  deleteAllForUser(userId: string) {
    return db().delete(sessions).where(eq(sessions.userId, userId));
  },
  /** Devolve quantas sessões foram apagadas. */
  async deleteExpired(now: Date): Promise<number> {
    const deleted = await db()
      .delete(sessions)
      .where(lt(sessions.expiresAt, now))
      .returning({ id: sessions.id });
    return deleted.length;
  },
};
