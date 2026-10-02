import { db, type DbOrTx } from '../../../infra/prisma/client';

export const passwordSetupTokenRepository = {
  create(data: { tokenHash: string; userId: string; expiresAt: Date }, tx: DbOrTx = db) {
    return tx.passwordSetupToken.create({ data });
  },
  findValid(tokenHash: string, now: Date) {
    return db.passwordSetupToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
      include: { user: true },
    });
  },
  markUsed(id: string, usedAt: Date, tx: DbOrTx = db) {
    return tx.passwordSetupToken.update({ where: { id }, data: { usedAt } });
  },
  invalidateAllForUser(userId: string, now: Date, tx: DbOrTx = db) {
    return tx.passwordSetupToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: now },
    });
  },
};
