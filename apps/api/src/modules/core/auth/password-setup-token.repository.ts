import { and, eq, gt, isNotNull, isNull, lt, or } from 'drizzle-orm';
import { db } from '../../../db/client';
import { passwordSetupTokens } from '../../../db/schema';

export const passwordSetupTokenRepository = {
  /** Builder para compor em `batch()`. */
  insert(data: { tokenHash: string; userId: string; expiresAt: Date }) {
    return db().insert(passwordSetupTokens).values(data);
  },
  findValid(tokenHash: string, now: Date) {
    return db().query.passwordSetupTokens.findFirst({
      where: and(
        eq(passwordSetupTokens.tokenHash, tokenHash),
        isNull(passwordSetupTokens.usedAt),
        gt(passwordSetupTokens.expiresAt, now),
      ),
      with: { user: true },
    });
  },
  /** Builder para compor em `batch()`. */
  markUsed(id: string, usedAt: Date) {
    return db().update(passwordSetupTokens).set({ usedAt }).where(eq(passwordSetupTokens.id, id));
  },
  /** Builder para compor em `batch()`. */
  invalidateAllForUser(userId: string, now: Date) {
    return db()
      .update(passwordSetupTokens)
      .set({ usedAt: now })
      .where(and(eq(passwordSetupTokens.userId, userId), isNull(passwordSetupTokens.usedAt)));
  },
  /** Apaga tokens expirados ou usados antes de `usedBefore`; devolve quantos. */
  async deleteStale(now: Date, usedBefore: Date): Promise<number> {
    const deleted = await db()
      .delete(passwordSetupTokens)
      .where(
        or(
          lt(passwordSetupTokens.expiresAt, now),
          and(isNotNull(passwordSetupTokens.usedAt), lt(passwordSetupTokens.usedAt, usedBefore)),
        ),
      )
      .returning({ id: passwordSetupTokens.id });
    return deleted.length;
  },
};
